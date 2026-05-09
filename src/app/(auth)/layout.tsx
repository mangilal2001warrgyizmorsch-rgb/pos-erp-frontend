"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname === "/register";

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Sliding Branding Panel */}
      <motion.div
        initial={false}
        animate={{ x: isRegister ? "100%" : "0%" }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="hidden lg:flex absolute top-0 bottom-0 left-0 w-1/2 z-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-12 items-center justify-center shadow-2xl"
      >
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">POS ERP</h1>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Modern Point of Sale
              <br />
              <span className="text-indigo-200">for your business</span>
            </h2>
            <p className="text-lg text-indigo-200/80 leading-relaxed">
              Streamline your sales, manage inventory, track customers, and grow
              your business with our premium ERP solution.
            </p>
          </motion.div>

          {/* Decorative elements */}
          <div className="mt-12">
            <div className="grid grid-cols-3 gap-4">
              {["Sales Analytics", "Inventory", "Reports"].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  className="rounded-xl bg-white/10 backdrop-blur-sm p-4 text-center"
                >
                  <p className="text-sm font-medium text-white/90">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pages Container */}
      <div className="w-full flex relative z-10">
        {children}
      </div>
    </div>
  );
}
