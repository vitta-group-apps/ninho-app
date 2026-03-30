// supabase/functions/invite-family-member/index.ts

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const logStep = (step: string) => {
  console.log(`[INVITE-FAMILY-MEMBER] ${step}`);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`Convite iniciado por: ${user.id}`);

    const { email, role, familyId } = await req.json();

    if (!email || !role || !familyId) {
      return new Response(
        JSON.stringify({ error: 'email, role e familyId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validRoles = ['admin', 'caregiver', 'viewer'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Papel inválido. Use: admin, caregiver ou viewer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: membership, error: memberError } = await supabaseUser
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (memberError || !membership) {
      return new Response(
        JSON.stringify({ error: 'Você não faz parte desta família' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: 'Apenas o Responsável ou Administrador pode convidar membros' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`Permissão verificada: ${membership.role}`);

    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://app.ninho.com'}/onboarding`,
        data: {
          invited_to_family: familyId,
          invited_role: role,
          invited_by: user.id,
        },
      }
    );

    if (inviteError) {
      logStep(`Erro ao enviar convite: ${inviteError.message}`);
      return new Response(
        JSON.stringify({ error: 'Não foi possível enviar o convite. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`Convite enviado. User ID: ${inviteData.user.id}`);

    const { error: insertError } = await supabaseAdmin
      .from('family_members')
      .upsert(
        {
          family_id: familyId,
          user_id: inviteData.user.id,
          role: role,
          status: 'pending',
          invited_by: user.id,
        },
        { onConflict: 'family_id,user_id' }
      );

    if (insertError) {
      logStep(`Erro ao inserir membro: ${insertError.message}`);
      return new Response(
        JSON.stringify({ error: 'Convite enviado mas não foi possível registrar o membro.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep(`Membro inserido com status pending`);

    return new Response(
      JSON.stringify({ success: true, message: `Convite enviado para ${email}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[INVITE-FAMILY-MEMBER] Erro inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
