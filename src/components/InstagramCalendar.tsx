import { useState, useMemo } from 'react';
import Icon from './Icon';
import type { ScheduledPost } from '../shared/types';

interface InstagramCalendarProps {
  scheduledPosts: ScheduledPost[];
  onSelectDate: (date: Date) => void;
  onMovePost?: (postId: string, newDate: Date) => void;
}

export default function InstagramCalendar({
  scheduledPosts,
  onSelectDate,
  onMovePost,
}: InstagramCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);

  // Get days in current month
  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Days from previous month to fill the grid
    const prevMonthDays: Date[] = [];
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthTotal = prevMonth.getDate();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        prevMonthDays.push(new Date(year, month - 1, prevMonthTotal - i));
      }
    }

    // Days of current month
    const currentMonthDays: Date[] = [];
    for (let i = 1; i <= totalDays; i++) {
      currentMonthDays.push(new Date(year, month, i));
    }

    // Days from next month to complete the grid (6 rows x 7 days = 42)
    const nextMonthDays: Date[] = [];
    const totalCells = 42;
    const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length;
    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push(new Date(year, month + 1, i));
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const getPostsForDay = (date: Date) => {
    return scheduledPosts.filter((post) => {
      const postDate = new Date(post.scheduledAt);
      return isSameDay(date, postDate);
    });
  };

  const handleDragStart = (e: React.DragEvent, postId: string) => {
    setDraggedPostId(postId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();

    if (draggedPostId && onMovePost && !isPast(date)) {
      // Keep the same time, just change the date
      const post = scheduledPosts.find((p) => p.id === draggedPostId);
      if (post) {
        const oldDate = new Date(post.scheduledAt);
        const newDate = new Date(date);
        newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
        onMovePost(draggedPostId, newDate);
      }
    }

    setDraggedPostId(null);
  };

  const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="mh-btn mh-btn-gray w-8 h-8 flex items-center justify-center"
            title="Mês anterior"
          >
            <Icon name="chevron_left" size={18} />
          </button>

          <h3 className="text-lg font-semibold text-white capitalize min-w-[200px] text-center">
            {monthName}
          </h3>

          <button
            onClick={goToNextMonth}
            className="mh-btn mh-btn-gray w-8 h-8 flex items-center justify-center"
            title="Próximo mês"
          >
            <Icon name="chevron_right" size={18} />
          </button>
        </div>

        <button
          onClick={goToToday}
          className="mh-btn mh-btn-gray h-8 px-3 text-xs"
        >
          Hoje
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2 flex-1">
          {days.map((date, index) => {
            const postsOnDay = getPostsForDay(date);
            const today = isToday(date);
            const past = isPast(date);
            const currentMonthDay = isCurrentMonth(date);

            return (
              <div
                key={index}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, date)}
                onClick={() => !past && onSelectDate(date)}
                className={`
                  relative min-h-[80px] p-2 rounded-lg border transition-all cursor-pointer
                  ${today ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5'}
                  ${!currentMonthDay ? 'opacity-40' : ''}
                  ${past ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/30 hover:bg-white/10'}
                  ${draggedPostId && !past ? 'ring-2 ring-pink-500/50' : ''}
                `}
              >
                {/* Day number */}
                <div
                  className={`text-sm font-medium mb-1 ${
                    today ? 'text-blue-400' : 'text-gray-400'
                  }`}
                >
                  {date.getDate()}
                </div>

                {/* Posts on this day */}
                <div className="space-y-1">
                  {postsOnDay.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      draggable={!past}
                      onDragStart={(e) => handleDragStart(e, post.id)}
                      className={`
                        text-[10px] px-1 py-0.5 rounded truncate cursor-move
                        ${
                          post.status === 'published'
                            ? 'bg-green-500/20 text-green-400'
                            : post.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-pink-500/20 text-pink-400'
                        }
                        ${draggedPostId === post.id ? 'opacity-50' : ''}
                      `}
                      title={post.caption}
                    >
                      {new Date(post.scheduledAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      - {post.caption.slice(0, 10)}...
                    </div>
                  ))}
                  {postsOnDay.length > 3 && (
                    <div className="text-[10px] text-gray-500">
                      +{postsOnDay.length - 3} mais
                    </div>
                  )}
                </div>

                {/* Empty state hint */}
                {postsOnDay.length === 0 && !past && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="text-xs text-gray-500">
                      Clique para agendar
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-pink-500/20 border border-pink-500/50" />
          <span>Agendado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
          <span>Publicado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50" />
          <span>Falhou</span>
        </div>
      </div>
    </div>
  );
}
