import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const DateRangePicker = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [viewMode, setViewMode] = useState('days'); // 'days' or 'months'

  const { start, end } = value || { start: null, end: null };

  // Quick select options
  const quickSelects = [
    {
      label: t('dateRange.thisWeekend'),
      color: 'from-blue-500 to-purple-500',
      getValue: () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + (6 - dayOfWeek));
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        return { start: saturday, end: sunday };
      }
    },
    {
      label: t('dateRange.nextWeek'),
      color: 'from-green-500 to-teal-500',
      getValue: () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + (7 - dayOfWeek + 1));
        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);
        return { start: nextMonday, end: nextSunday };
      }
    },
    {
      label: t('dateRange.nextMonth'),
      color: 'from-orange-500 to-red-500',
      getValue: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        return { start: firstDay, end: lastDay };
      }
    },
    {
      label: t('dateRange.flexible'),
      color: 'from-indigo-500 to-pink-500',
      getValue: () => null
    }
  ];

  const calendar = useMemo(() => {
    if (viewMode === 'months') {
      const year = currentMonth.getFullYear();
      const months = [];
      for (let i = 0; i < 12; i++) {
        months.push(new Date(year, i, 1));
      }
      return {
        months,
        year: year,
        viewTitle: year.toString()
      };
    } else {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      const endDate = new Date(lastDay);

      // Start from Sunday of the week containing the first day
      startDate.setDate(startDate.getDate() - startDate.getDay());
      // End on Saturday of the week containing the last day
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

      const days = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      return {
        days,
        viewTitle: firstDay.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
        firstDayOfMonth: firstDay,
        lastDayOfMonth: lastDay
      };
    }
  }, [currentMonth, viewMode]);

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!start && !end) return false;
    if (start && date.toDateString() === start.toDateString()) return true;
    if (end && date.toDateString() === end.toDateString()) return true;
    return false;
  };

  const isInRange = (date) => {
    if (!start || !end) return false;
    return date > start && date < end;
  };

  const isDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date) => {
    if (isDisabled(date)) return;

    if (!start || (start && end) || date < start) {
      // Start new selection
      onChange({ start: date, end: null });
      setSelectingEnd(true);
    } else if (start && !end) {
      // Complete the range
      onChange({ start, end: date });
      setSelectingEnd(false);
    }
  };

  const handleQuickSelect = (quickSelect) => {
    const range = quickSelect.getValue?.();
    onChange(range);
    setSelectingEnd(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (viewMode === 'months') {
        newMonth.setFullYear(newMonth.getFullYear() + direction);
      } else {
        newMonth.setMonth(newMonth.getMonth() + direction);
      }
      return newMonth;
    });
  };

  const handleMonthSelect = (month) => {
    if (!start || (start && end)) {
      // Start new selection - select whole month
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      onChange({ start: startOfMonth, end: endOfMonth });
      setSelectingEnd(false);
      setViewMode('days');
    } else if (start && !end) {
      // Complete range selection
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      if (startOfMonth < start) {
        onChange({ start: startOfMonth, end: start });
      } else {
        onChange({ start, end: endOfMonth });
      }
      setSelectingEnd(false);
      setViewMode('days');
    }
  };

  const formatDateRange = () => {
    if (!start && !end) return t('dateRange.selectDates');
    if (start && !end) return `${start.toLocaleDateString('tr-TR')} - ${t('dateRange.selectEndDate')}`;
    if (start && end) {
      return `${start.toLocaleDateString('tr-TR')} - ${end.toLocaleDateString('tr-TR')}`;
    }
    return t('dateRange.selectDates');
  };

  return (
    <div className="space-y-4">
      {/* Selected Range Display */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Seçilen Tarih</div>
            <div className="text-sm font-bold text-gray-900">{formatDateRange()}</div>
          </div>
        </div>
      </div>

      {/* Quick Select Options */}
      <div className="grid grid-cols-2 gap-3">
        {quickSelects.map((option, index) => {
          const range = option.getValue?.();
          const isActive = range && start && end && 
            range.start?.toDateString() === start.toDateString() &&
            range.end?.toDateString() === end.toDateString();
          
          return (
            <button
              key={index}
              onClick={() => handleQuickSelect(option)}
              className={`p-4 rounded-xl border-2 text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                isActive
                  ? `bg-gradient-to-r ${option.color} text-white border-transparent shadow-lg`
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-white hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 shadow-sm hover:shadow-md'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={t('dateRange.previousMonth')}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {calendar.month}
        </h3>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={t('dateRange.nextMonth')}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendar.days.map((date, index) => {
          const isCurrentMonth = date >= calendar.firstDayOfMonth && date <= calendar.lastDayOfMonth;
          const disabled = isDisabled(date);
          const selected = isSelected(date);
          const inRange = isInRange(date);
          const today = isToday(date);
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={`
                p-2 text-sm font-medium rounded-lg transition-colors relative
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'}
                ${selected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                ${inRange ? 'bg-blue-100 text-blue-700' : ''}
                ${today && !selected ? 'ring-2 ring-blue-500 ring-inset' : ''}
              `}
              aria-label={date.toLocaleDateString('tr-TR')}
              aria-pressed={selected}
            >
              {date.getDate()}
              {today && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="text-xs text-gray-500 text-center">
        {selectingEnd ? t('dateRange.selectEndDate') : t('dateRange.selectStartDate')}
      </div>

      {/* Clear Selection */}
      {(start || end) && (
        <button
          onClick={() => {
            onChange({ start: null, end: null });
            setSelectingEnd(false);
          }}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          {t('dateRange.clear')}
        </button>
      )}
    </div>
  );
};

export default DateRangePicker;