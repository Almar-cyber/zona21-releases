import { useState, useEffect } from 'react';
import Icon from './Icon';
import type { Asset } from '../shared/types';

interface InstagramHashtagSuggestionsProps {
  asset?: Asset;
  currentHashtags: string;
  onAddHashtag: (hashtag: string) => void;
  onAddHashtags: (hashtags: string[]) => void;
}

// Popular hashtags por categoria
const HASHTAG_CATEGORIES = {
  fotografia: [
    '#photography',
    '#photooftheday',
    '#photo',
    '#photographer',
    '#picoftheday',
    '#instagood',
    '#beautiful',
    '#art',
  ],
  natureza: [
    '#nature',
    '#naturephotography',
    '#landscape',
    '#landscapephotography',
    '#naturelovers',
    '#outdoors',
    '#hiking',
    '#mountains',
  ],
  retrato: [
    '#portrait',
    '#portraitphotography',
    '#model',
    '#fashion',
    '#style',
    '#beauty',
    '#people',
    '#face',
  ],
  viagem: [
    '#travel',
    '#travelphotography',
    '#instatravel',
    '#travelgram',
    '#wanderlust',
    '#explore',
    '#adventure',
    '#trip',
  ],
  comida: [
    '#food',
    '#foodphotography',
    '#foodie',
    '#instafood',
    '#foodstagram',
    '#delicious',
    '#yummy',
    '#cooking',
  ],
  pet: [
    '#pet',
    '#pets',
    '#dog',
    '#cat',
    '#animal',
    '#cute',
    '#petphotography',
    '#instapet',
  ],
};

export default function InstagramHashtagSuggestions({
  asset,
  currentHashtags,
  onAddHashtag,
  onAddHashtags,
}: InstagramHashtagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('fotografia');
  const [isGenerating, setIsGenerating] = useState(false);

  // Parse current hashtags
  const currentHashtagsList = currentHashtags
    .split(/\s+/)
    .filter((tag) => tag.startsWith('#'))
    .map((tag) => tag.toLowerCase());

  useEffect(() => {
    // Auto-detect category from asset tags (if available)
    if (asset?.tags && asset.tags.length > 0) {
      const tags = asset.tags.map((t) => t.toLowerCase());

      if (tags.some((t) => ['natureza', 'paisagem', 'montanha'].includes(t))) {
        setSelectedCategory('natureza');
      } else if (tags.some((t) => ['retrato', 'pessoa', 'modelo'].includes(t))) {
        setSelectedCategory('retrato');
      } else if (tags.some((t) => ['viagem', 'praia', 'cidade'].includes(t))) {
        setSelectedCategory('viagem');
      } else if (tags.some((t) => ['comida', 'restaurante', 'culinária'].includes(t))) {
        setSelectedCategory('comida');
      } else if (tags.some((t) => ['cachorro', 'gato', 'pet', 'animal'].includes(t))) {
        setSelectedCategory('pet');
      }
    }
  }, [asset]);

  useEffect(() => {
    // Load suggestions for selected category
    const categoryHashtags = HASHTAG_CATEGORIES[selectedCategory as keyof typeof HASHTAG_CATEGORIES] || [];

    // Filter out already used hashtags
    const filtered = categoryHashtags.filter(
      (tag) => !currentHashtagsList.includes(tag.toLowerCase())
    );

    setSuggestions(filtered);
  }, [selectedCategory, currentHashtags]);

  const handleGenerateAI = async () => {
    setIsGenerating(true);

    // TODO: Integrate with AI Manager for smart hashtag generation
    // For now, mix hashtags from different categories
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate AI processing

      const allHashtags = Object.values(HASHTAG_CATEGORIES).flat();
      const shuffled = allHashtags.sort(() => Math.random() - 0.5);
      const unique = [...new Set(shuffled)].filter(
        (tag) => !currentHashtagsList.includes(tag.toLowerCase())
      );

      setSuggestions(unique.slice(0, 12));
    } catch (error) {
      console.error('Failed to generate hashtags:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddAll = () => {
    onAddHashtags(suggestions.slice(0, 10)); // Add first 10
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="tag" size={18} className="text-pink-400" />
          <span className="text-sm font-medium text-gray-300">Sugestões de Hashtags</span>
        </div>

        <button
          onClick={handleGenerateAI}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-xs font-medium text-pink-400 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-3 h-3 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Icon name="auto_awesome" size={14} />
              Gerar com IA
            </>
          )}
        </button>
      </div>

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.keys(HASHTAG_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
              ${
                selectedCategory === category
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Suggestions grid */}
      <div className="flex flex-wrap gap-2">
        {suggestions.length > 0 ? (
          suggestions.map((hashtag) => (
            <button
              key={hashtag}
              onClick={() => onAddHashtag(hashtag)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/50 text-xs text-gray-300 hover:text-pink-300 transition-all"
              title="Clique para adicionar"
            >
              {hashtag}
            </button>
          ))
        ) : (
          <div className="text-xs text-gray-500 italic">
            Você já está usando todas as hashtags populares desta categoria! 🎉
          </div>
        )}
      </div>

      {/* Add all button */}
      {suggestions.length > 0 && (
        <button
          onClick={handleAddAll}
          className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition-all"
        >
          Adicionar primeiras 10 hashtags
        </button>
      )}

      {/* Tips */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
        <div className="flex items-start gap-2">
          <Icon name="lightbulb" size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong>Dica:</strong> Use entre 5-10 hashtags relevantes. Evite hashtags genéricas demais (#love, #instagood) e foque em nichos específicos para melhor alcance.
          </div>
        </div>
      </div>

      {/* Counter */}
      <div className="text-xs text-gray-500 text-center">
        {currentHashtagsList.length} hashtags • Limite Instagram: 30
      </div>
    </div>
  );
}
