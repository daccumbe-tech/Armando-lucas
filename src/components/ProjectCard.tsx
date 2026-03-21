import { Project } from '../types';
import { Calendar, Tag, User, ExternalLink, Heart } from 'lucide-react';
import StarRating from './StarRating';

interface ProjectCardProps {
  project: Project;
  onViewDetails?: (project: Project) => void;
  onViewProfile?: (uid: string) => void;
  onLike?: (id: string) => void;
  onRate?: (id: string, stars: number) => void;
  currentUserId?: string;
}

export default function ProjectCard({ project, onViewDetails, onViewProfile, onLike, onRate, currentUserId }: ProjectCardProps) {
  const formattedDate = project.createdAt?.toDate?.() 
    ? project.createdAt.toDate().toLocaleDateString('pt-BR') 
    : new Date().toLocaleDateString('pt-BR');

  const isLiked = project.likedBy?.includes(currentUserId || '');
  const userRating = project.rating?.ratedBy?.includes(currentUserId || '') ? 1 : 0; // Simplified for UI feedback

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
      
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar size={14} />
            <span>{formattedDate}</span>
            <span className="mx-1">•</span>
            <User size={14} />
            <button 
              onClick={() => onViewProfile?.(project.talentId)}
              className="font-medium text-indigo-600 hover:underline"
            >
              {project.talentName}
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
            <Heart size={12} />
            {project.likesCount || 0}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {project.title}
        </h3>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
          {project.description}
        </p>

        <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col gap-4">
          <StarRating 
            rating={project.rating?.average || 0} 
            count={project.rating?.count || 0}
            onRate={(stars) => onRate?.(project.id, stars)}
            readOnly={!currentUserId || project.rating?.ratedBy?.includes(currentUserId || '') || project.talentId === currentUserId}
          />
          
          <button 
            onClick={() => onViewDetails?.(project)}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-3 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all"
          >
            Ver Detalhes
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
