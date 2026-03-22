import React from 'react';
import { Shield, Lock, FileText, AlertCircle, CheckCircle, Scale, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="bg-indigo-600 p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText size={32} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Termos de Uso</h1>
            <p className="text-indigo-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Bem-vindo ao TalentLink. Ao utilizar nossa plataforma, você concorda com as diretrizes e regras estabelecidas abaixo.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-12 space-y-12">
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                <Scale size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">1. Objetivo da Plataforma</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              O TalentLink é uma plataforma digital internacional projetada para conectar jovens talentos a investidores visionários. Nosso objetivo é facilitar a descoberta de novos projetos, o networking profissional e o fomento de investimentos em ideias inovadoras. Atuamos como um intermediário tecnológico que fornece as ferramentas necessárias para que essas conexões ocorram de forma segura e eficiente.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                <CheckCircle size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">2. Regras de Utilização</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Para manter a integridade da comunidade, todos os usuários devem seguir as seguintes regras:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {[
                'Fornecer informações reais, completas e atualizadas.',
                'Respeitar a propriedade intelectual de terceiros.',
                'Utilizar linguagem profissional e respeitosa.',
                'Manter a confidencialidade das suas credenciais de acesso.'
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl text-sm text-gray-700">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                <AlertCircle size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">3. Proibições e Segurança</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              É estritamente proibido o uso da plataforma para:
            </p>
            <div className="bg-red-50 border border-red-100 p-6 rounded-3xl space-y-3">
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                Atividades fraudulentas ou enganosas.
              </p>
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                Pedidos diretos de dinheiro ou transferências financeiras não autorizadas.
              </p>
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                Comportamento abusivo, assédio ou discurso de ódio.
              </p>
            </div>
            <p className="text-gray-600 leading-relaxed text-sm italic">
              Implementamos medidas rigorosas de segurança, incluindo verificação de e-mail/telefone, KYC (Know Your Customer) para investidores, chat interno com proteção de dados e um sistema de denúncias ativo. Reservamo-nos o direito de suspender ou banir permanentemente qualquer conta suspeita de violar estes termos.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <Shield size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">4. Responsabilidade e Interações</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              O TalentLink não se responsabiliza por quaisquer acordos, transações ou interações que ocorram fora do nosso sistema oficial. Recomendamos fortemente que todas as comunicações iniciais e negociações sejam mantidas dentro do chat da plataforma para garantir o monitoramento de segurança e a validade de possíveis denúncias.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                <CreditCard size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">5. Futuras Funcionalidades Premium</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Atualmente, as funcionalidades básicas do TalentLink são gratuitas. No entanto, informamos que futuramente poderão ser introduzidas taxas de serviço ou planos de assinatura pagos para acesso a funcionalidades premium, ferramentas avançadas de análise ou maior visibilidade na plataforma.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Última atualização: 22 de Março de 2026. Para dúvidas, entre em contato com o suporte.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
