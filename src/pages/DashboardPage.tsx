import { useNinhoStore } from '@/store/useNinhoStore'

export function DashboardPage() {
  const store   = useNinhoStore()
  const child   = store.currentChild
  const family  = store.currentFamily

  return (
    <div className="min-h-screen bg-stone-200">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sage-500 flex items-center justify-center">
            <span className="text-white font-serif text-base">n</span>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-sans">{family?.name}</p>
            <h1 className="text-base font-serif text-stone-800 leading-tight">
              {child?.preferred_name ?? 'Ninho'}
            </h1>
          </div>
        </div>
        <button
          onClick={() => store.signOut()}
          className="text-xs text-stone-400 hover:text-stone-600 transition px-3 py-1.5 rounded-lg hover:bg-stone-100"
        >
          Sair
        </button>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8 space-y-4 animate-fade-in">
        {/* Welcome card */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
          <p className="text-sm text-stone-400 mb-1">Bem-vinda ao</p>
          <h2 className="text-2xl font-serif text-stone-800 mb-3">
            ninho de {child?.preferred_name ?? family?.name}
          </h2>
          <p className="text-sm text-stone-500 leading-relaxed">
            Estamos a construir as funcionalidades. Em breve vais poder registar
            rotinas, acompanhar o desenvolvimento e muito mais.
          </p>
        </div>

        {/* Quick stats placeholder */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Rotinas', emoji: '🌙', color: 'bg-sage-50 border-sage-100' },
            { label: 'Registos', emoji: '📝', color: 'bg-earth-50 border-earth-100' },
            { label: 'Saúde', emoji: '💚', color: 'bg-stone-50 border-stone-200' },
            { label: 'Família', emoji: '👨‍👩‍👧', color: 'bg-mauve-50 border-mauve-100' },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl p-4 border ${item.color} flex flex-col gap-2`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm font-medium text-stone-600">{item.label}</span>
              <span className="text-xs text-stone-400">Em breve</span>
            </div>
          ))}
        </div>

        {/* Child info */}
        {child && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
            <h3 className="text-sm font-medium text-stone-500 mb-3">Criança activa</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                <span className="text-sage-600 font-serif text-lg">
                  {child.preferred_name ?? ""[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-stone-800">{child.preferred_name ?? ""}</p>
                {child.birth_date && (
                  <p className="text-xs text-stone-400">
                    Nasceu em {new Date(child.birth_date).toLocaleDateString('pt-PT')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
