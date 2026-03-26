import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { HomeIcon } from "@heroicons/react/24/outline";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) console.warn('[404]', location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{ backgroundColor: "hsl(var(--ninho-sand))" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-7xl mb-4">🐣</p>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "hsl(var(--ninho-brown))", fontFamily: "Quicksand, sans-serif" }}
        >
          Página não encontrada
        </h1>
        <p
          className="text-sm mb-8 max-w-xs"
          style={{ color: "hsl(var(--muted-foreground))", fontFamily: "Nunito, sans-serif" }}
        >
          Este caminho não existe no ninho.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold"
          style={{ backgroundColor: "hsl(var(--ninho-sage))", fontFamily: "Nunito, sans-serif" }}
        >
          <HomeIcon className="w-4 h-4" />
          Voltar para o início
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
