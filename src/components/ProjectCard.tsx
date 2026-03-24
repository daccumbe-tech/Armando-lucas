import { Project } from '../types';
import { Calendar, Tag, User, ExternalLink, Heart, MessageSquare, Clock, Star, ShieldCheck } from 'lucide-react';
import StarRating from './StarRating';

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (project: Project) => void;
  onViewProfile?: (uid: string) => void;
  onLike?: (id: string) => void;
  onRate?: (id: string, stars: number) => void;
  onToggleStatus?: (id: string) => void;
  currentUserId?: string;
  compact?: boolean;
}

export default function ProjectCard({ 
  project, 
  onViewDetails, 
  onViewProfile, 
  onLike, 
  onRate, 
  onToggleStatus, 
  currentUserId,
  compact = false
}: ProjectCardProps) {
  const formattedDate = project.createdAt?.toDate?.() 
    ? project.createdAt.toDate().toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  const formattedDeadline = project.deadline?.toDate?.()
    ? project.deadline.toDate().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  const isLiked = project.likedBy?.includes(currentUserId || '');
  const userRating = project.rating?.ratedBy?.includes(currentUserId || '') ? 1 : 0; // Simplified for UI feedback

  if (compact) {
    return (
      <div 
        onClick={() => onViewDetails?.(project)}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group cursor-pointer flex flex-col h-full"
      >
        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden flex-shrink-0">
          {project.imageUrl ? (
            <img 
              src={project.imageUrl} 
              alt={project.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Tag size={32} strokeWidth={1} />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="bg-white/90 backdrop-blur-sm text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              {project.category}
            </span>
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {project.title}
          </h3>
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
              <Star size={10} className="text-yellow-400 fill-yellow-400 sm:w-3 sm:h-3" />
              <span className="font-bold text-gray-600">{project.rating?.average?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400">
              <div className="flex items-center gap-0.5">
                <Heart size={10} className="sm:w-3 sm:h-3" />
                {project.likesCount || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      <div className="aspect-video bg-gray-100 relative overflow-hidden flex-shrink-0">
        {project.imageUrl ? (
          <img 
            src={project.imageUrl} 
            alt={project.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Tag size={48} strokeWidth={1} />
          </div>
        )}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-white/90 backdrop-blur-sm text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {project.category}
          </span>
          {project.talentId === currentUserId && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm ${
              project.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              {project.status === 'published' ? 'Publicado' : 'Rascunho'}
            </span>
          )}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onLike?.(project.id);
          }}
          className={`absolute top-4 right-4 p-2 rounded-full shadow-sm transition-all ${
            isLiked ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>
      
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
            <Calendar size={14} />
            <span>{formattedDate}</span>
            <span className="mx-1">•</span>
            <User size={14} />
            <button 
              onClick={() => onViewProfile?.(project.talentId)}
              className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
            >
              {project.talentName}
              {project.talentIsFounder && (
                <ShieldCheck size={12} className="text-amber-500" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-gray-400">
            <div className="flex items-center gap-1">
              <Heart size={12} />
              {project.likesCount || 0}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare size={12} />
              {project.commentsCount || 0}
            </div>
          </div>
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {project.title}
        </h3>
        
        {formattedDeadline && (
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-amber-600 mb-3 bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
            <Clock size={14} />
            <span>Prazo: {formattedDeadline}</span>
          </div>
        )}

        <p className="text-gray-500 text-xs sm:text-sm mb-4 line-clamp-2 h-8 sm:h-10">
          {project.description}
        </p>

        {project.requiredSkills && project.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.requiredSkills.map((skill, index) => (
              <span 
                key={index} 
                className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <StarRating 
              rating={project.rating?.average || 0} 
              count={project.rating?.count || 0}
              onRate={(stars) => onRate?.(project.id, stars)}
              readOnly={!currentUserId || project.rating?.ratedBy?.includes(currentUserId || '') || project.talentId === currentUserId}
            />
            {project.projectLink && (
              <a 
                href={project.projectLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Ver Projeto"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
          
          <button 
            onClick={() => onViewDetails?.(project)}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-3 sm:py-3.5 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all"
          >
            Ver Detalhes
          </button>

          {project.talentId === currentUserId && onToggleStatus && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(project.id);
              }}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all border ${
                project.status === 'published' 
                  ? 'border-amber-200 text-amber-600 hover:bg-amber-50' 
                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {project.status === 'published' ? 'Mudar para Rascunho' : 'Publicar Projeto'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
