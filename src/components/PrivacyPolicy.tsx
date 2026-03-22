import React from 'react';
import { Shield, Lock, Eye, Database, Share2, UserCheck, Cookie, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="bg-emerald-600 p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Política de Privacidade</h1>
            <p className="text-emerald-100 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Sua privacidade é nossa prioridade. Saiba como coletamos, usamos e protegemos seus dados no TalentLink.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-12 space-y-12">
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <Database size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">1. Dados Coletados</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Para fornecer nossos serviços de forma eficiente e segura, coletamos as seguintes informações:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {[
                { title: 'Informações de Perfil', desc: 'Nome, e-mail, telefone e foto de perfil.' },
                { title: 'Documentos de Verificação', desc: 'Documentos de identidade para processos de KYC (apenas investidores).' },
                { title: 'Dados de Uso', desc: 'Informações sobre como você interage com a plataforma.' },
                { title: 'Comunicações', desc: 'Mensagens enviadas através do nosso chat interno.' }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                <Eye size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">2. Como Usamos Seus Dados</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Os dados coletados são utilizados exclusivamente para as seguintes finalidades:
            </p>
            <ul className="space-y-3">
              {[
                'Garantir a segurança e integridade da plataforma.',
                'Realizar processos de verificação de identidade (KYC).',
                'Melhorar continuamente nossos serviços e experiência do usuário.',
                'Facilitar a conexão entre talentos e investidores de forma legítima.',
                'Cumprir obrigações legais e regulatórias.'
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <Lock size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">3. Proteção e Segurança</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Empregamos tecnologias de ponta para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia de dados em repouso e em trânsito, monitoramento constante de vulnerabilidades e políticas rigorosas de acesso interno. Seus documentos de verificação são armazenados em ambientes altamente seguros e acessados apenas por pessoal autorizado.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <Cookie size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">4. Cookies e Rastreamento</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Utilizamos cookies e tecnologias similares para melhorar a navegação, lembrar suas preferências e analisar o tráfego do site. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador, mas lembre-se que desativar certos cookies pode afetar a funcionalidade da plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                <Share2 size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">5. Compartilhamento de Dados</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Não vendemos seus dados pessoais para terceiros. O compartilhamento ocorre apenas quando:
            </p>
            <div className="bg-purple-50 border border-purple-100 p-6 rounded-3xl">
              <p className="text-sm text-purple-900 leading-relaxed">
                - For necessário para a prestação do serviço (ex: processamento de verificação por parceiros especializados).<br />
                - Houver exigência legal ou ordem judicial.<br />
                - For essencial para proteger a segurança de nossos usuários ou a integridade da plataforma.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                <UserCheck size={18} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">6. Seus Direitos</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de seus dados pessoais a qualquer momento. Além disso, você pode retirar seu consentimento para o processamento de dados, onde aplicável. Para exercer esses direitos, utilize as ferramentas disponíveis no seu perfil ou entre em contato com nosso Encarregado de Proteção de Dados (DPO).
            </p>
          </section>

          <div className="pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Última atualização: 22 de Março de 2026. Sua confiança é fundamental para nós.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
