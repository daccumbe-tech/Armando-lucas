import React from 'react';
import { motion } from 'motion/react';
import { Award, Globe, Shield, Target, Users, Zap } from 'lucide-react';

export default function About() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="text-center mb-16">
        <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Sobre Nós</h2>
        <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
          D@C (Dreams Altern Concepts)
        </p>
        <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
          Transformando sonhos em conceitos alternativos e realidade global.
        </p>
      </div>

      <div className="space-y-16">
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
              <Target size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Nossa Missão</h3>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">
            A **D@C (Dreams Altern Concepts)** nasceu da visão de que o talento não tem fronteiras, mas muitas vezes carece de visibilidade. Sob a liderança de **Armando Lucas Cumbe**, nossa organização dedica-se a identificar, promover e conectar mentes brilhantes com investidores visionários que buscam impacto real e inovação disruptiva.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600 w-fit mb-6">
              <Zap size={24} />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-4">Para Talentos</h4>
            <p className="text-gray-600">
              Oferecemos uma vitrine internacional para que seus projetos e habilidades alcancem quem realmente pode impulsionar sua carreira ao próximo nível.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 w-fit mb-6">
              <Shield size={24} />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-4">Para Investidores</h4>
            <p className="text-gray-600">
              Garantimos acesso a uma curadoria de talentos emergentes, proporcionando segurança e transparência em cada conexão estabelecida na plataforma.
            </p>
          </div>
        </section>

        <section className="bg-indigo-600 rounded-[2.5rem] p-8 sm:p-12 text-white overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                <Globe size={28} />
              </div>
              <h3 className="text-2xl font-bold">Visão Internacional</h3>
            </div>
            <p className="text-lg text-indigo-100 leading-relaxed mb-8">
              Acreditamos que a inovação moçambicana e africana tem um lugar de destaque no palco global. A D@C, liderada por Armando Lucas Cumbe, atua como a ponte que encurta distâncias entre o potencial local e o capital internacional, fomentando um ecossistema de prosperidade mútua.
            </p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Award size={20} className="text-indigo-300" />
                <span className="font-medium">Excelência</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={20} className="text-indigo-300" />
                <span className="font-medium">Colaboração</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-indigo-300" />
                <span className="font-medium">Integridade</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </section>

        <div className="text-center pt-8">
          <p className="text-gray-400 text-sm italic">
            Uma iniciativa D@C (Dreams Altern Concepts) | Armando Lucas Cumbe
          </p>
        </div>
      </div>
    </motion.div>
  );
}
