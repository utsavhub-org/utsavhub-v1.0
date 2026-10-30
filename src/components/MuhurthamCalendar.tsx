import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ChevronLeft, ChevronRight, Sparkles, Check, Info } from 'lucide-react-native';
import { THEME } from '../theme/colors';

// Hindu & Telugu Panchangam Auspicious Wedding Muhurtham Registry (2026 - 2027)
export interface MuhurthamInfo {
  name: string;
  lagnam: string;
  nakshatram: string;
  tithi: string;
  rating: 'peak' | 'auspicious';
}

export const HINDU_MUHURTHAMS: Record<string, MuhurthamInfo> = {
  // November 2026 (Karthika Masam)
  '2026-11-18': { name: 'Anuradha Subha', lagnam: 'Dhanur Lagnam', nakshatram: 'Anuradha', tithi: 'Dasami', rating: 'auspicious' },
  '2026-11-20': { name: 'Swati Muhurtham', lagnam: 'Kumbha Lagnam', nakshatram: 'Swati', tithi: 'Dwadasi', rating: 'peak' },
  '2026-11-21': { name: 'Vishakha Subha', lagnam: 'Meena Lagnam', nakshatram: 'Vishakha', tithi: 'Trayodasi', rating: 'auspicious' },
  '2026-11-25': { name: 'Uttarabhadra', lagnam: 'Vrishabha Lagnam', nakshatram: 'Uttarabhadra', tithi: 'Purnima', rating: 'peak' },
  '2026-11-28': { name: 'Rohini Subha', lagnam: 'Mithuna Lagnam', nakshatram: 'Rohini', tithi: 'Tadiya', rating: 'peak' },
  '2026-11-29': { name: 'Mrigashira', lagnam: 'Karkataka Lagnam', nakshatram: 'Mrigashira', tithi: 'Chavithi', rating: 'auspicious' },

  // December 2026 (Margashira Masam)
  '2026-12-04': { name: 'Revati Subha', lagnam: 'Simha Lagnam', nakshatram: 'Revati', tithi: 'Navami', rating: 'auspicious' },
  '2026-12-08': { name: 'Magha Muhurtham', lagnam: 'Kanya Lagnam', nakshatram: 'Magha', tithi: 'Trayodasi', rating: 'peak' },
  '2026-12-11': { name: 'Uttara Subha', lagnam: 'Tula Lagnam', nakshatram: 'Uttara Phalguni', tithi: 'Prathama', rating: 'auspicious' },
  '2026-12-14': { name: 'Swati Peak Muhurtham', lagnam: 'Dhanur Lagnam', nakshatram: 'Swati', tithi: 'Panchami', rating: 'peak' },
  '2026-12-18': { name: 'Anuradha', lagnam: 'Kumbha Lagnam', nakshatram: 'Anuradha', tithi: 'Navami', rating: 'auspicious' },
  '2026-12-22': { name: 'Ashwini Subha', lagnam: 'Meena Lagnam', nakshatram: 'Ashwini', tithi: 'Trayodasi', rating: 'auspicious' },
  '2026-12-25': { name: 'Rohini Holiday Muhurtham', lagnam: 'Mithuna Lagnam', nakshatram: 'Rohini', tithi: 'Purnima', rating: 'peak' },

  // January 2027 (Pushya / Magha Masam - Sankranti Season)
  '2027-01-15': { name: 'Sankranti Subha', lagnam: 'Makara Lagnam', nakshatram: 'Shravana', tithi: 'Sapthami', rating: 'peak' },
  '2027-01-18': { name: 'Rohini Subha', lagnam: 'Kumbha Lagnam', nakshatram: 'Rohini', tithi: 'Dasami', rating: 'peak' },
  '2027-01-22': { name: 'Pushya Muhurtham', lagnam: 'Meena Lagnam', nakshatram: 'Pushyami', tithi: 'Chaturdasi', rating: 'auspicious' },
  '2027-01-25': { name: 'Magha Subha', lagnam: 'Mesha Lagnam', nakshatram: 'Magha', tithi: 'Dvitiya', rating: 'auspicious' },
  '2027-01-28': { name: 'Uttara Phalguni', lagnam: 'Vrishabha Lagnam', nakshatram: 'Uttara', tithi: 'Panchami', rating: 'peak' },

  // February 2027 (Magha Masam - Peak Wedding Wave)
  '2027-02-05': { name: 'Swati Subha', lagnam: 'Mithuna Lagnam', nakshatram: 'Swati', tithi: 'Trayodasi', rating: 'auspicious' },
  '2027-02-10': { name: 'Magha Pournami Subha', lagnam: 'Simha Lagnam', nakshatram: 'Magha', tithi: 'Purnima', rating: 'peak' },
  '2027-02-14': { name: 'Anuradha Peak', lagnam: 'Kanya Lagnam', nakshatram: 'Anuradha', tithi: 'Panchami', rating: 'peak' },
  '2027-02-18': { name: 'Uttarabhadra', lagnam: 'Tula Lagnam', nakshatram: 'Uttarabhadra', tithi: 'Navami', rating: 'auspicious' },
  '2027-02-20': { name: 'Rohini Subha', lagnam: 'Dhanur Lagnam', nakshatram: 'Rohini', tithi: 'Ekadasi', rating: 'peak' },
  '2027-02-24': { name: 'Mrigashira Subha', lagnam: 'Kumbha Lagnam', nakshatram: 'Mrigashira', tithi: 'Trayodasi', rating: 'auspicious' },

  // March 2027 (Phalguna Masam)
  '2027-03-03': { name: 'Swati Muhurtham', lagnam: 'Meena Lagnam', nakshatram: 'Swati', tithi: 'Sapthami', rating: 'peak' },
  '2027-03-07': { name: 'Anuradha Subha', lagnam: 'Vrishabha Lagnam', nakshatram: 'Anuradha', tithi: 'Dasami', rating: 'auspicious' },
  '2027-03-12': { name: 'Revati Subha', lagnam: 'Mithuna Lagnam', nakshatram: 'Revati', tithi: 'Chaturdasi', rating: 'auspicious' },
  '2027-03-18': { name: 'Rohini Peak', lagnam: 'Karkataka Lagnam', nakshatram: 'Rohini', tithi: 'Panchami', rating: 'peak' },
  '2027-03-25': { name: 'Uttara Subha', lagnam: 'Simha Lagnam', nakshatram: 'Uttara Phalguni', tithi: 'Dwadasi', rating: 'auspicious' },

  // April 2027 (Chaitra Masam)
  '2027-04-08': { name: 'Chaitra Subha', lagnam: 'Kanya Lagnam', nakshatram: 'Rohini', tithi: 'Vidiya', rating: 'peak' },
  '2027-04-14': { name: 'Rohini Muhurtham', lagnam: 'Tula Lagnam', nakshatram: 'Rohini', tithi: 'Sapthami', rating: 'peak' },
  '2027-04-20': { name: 'Swati Subha', lagnam: 'Dhanur Lagnam', nakshatram: 'Swati', tithi: 'Trayodasi', rating: 'auspicious' },
  '2027-04-26': { name: 'Anuradha Peak', lagnam: 'Kumbha Lagnam', nakshatram: 'Anuradha', tithi: 'Panchami', rating: 'peak' },

  // May 2027 (Vaisakha Masam - Peak Royal Weddings)
  '2027-05-04': { name: 'Akshaya Tritiya Subha', lagnam: 'Meena Lagnam', nakshatram: 'Rohini', tithi: 'Tadiya (Akshaya)', rating: 'peak' },
  '2027-05-08': { name: 'Rohini Subha', lagnam: 'Mesha Lagnam', nakshatram: 'Rohini', tithi: 'Sapthami', rating: 'peak' },
  '2027-05-14': { name: 'Mrigashira Subha', lagnam: 'Vrishabha Lagnam', nakshatram: 'Mrigashira', tithi: 'Dwadasi', rating: 'auspicious' },
  '2027-05-19': { name: 'Magha Peak', lagnam: 'Mithuna Lagnam', nakshatram: 'Magha', tithi: 'Purnima', rating: 'peak' },
  '2027-05-25': { name: 'Swati Subha', lagnam: 'Karkataka Lagnam', nakshatram: 'Swati', tithi: 'Panchami', rating: 'peak' },
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface MuhurthamCalendarProps {
  initialDate?: string;
  onSelectDate: (date: string, muhurtham?: MuhurthamInfo) => void;
  onClose?: () => void;
}

export default function MuhurthamCalendar({
  initialDate = '2026-11-20',
  onSelectDate,
  onClose,
}: MuhurthamCalendarProps) {
  // Parse initial date
  const parsedDate = new Date(initialDate);
  const validInitialYear = isNaN(parsedDate.getFullYear()) ? 2026 : parsedDate.getFullYear();
  const validInitialMonth = isNaN(parsedDate.getMonth()) ? 10 : parsedDate.getMonth();

  const [currentYear, setCurrentYear] = useState<number>(validInitialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(validInitialMonth);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(initialDate);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build calendar matrix for current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Create grid cells (blanks + dates)
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const selectedMuhurtham = HINDU_MUHURTHAMS[selectedDateStr];

  const handleDayPress = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${mm}-${dd}`;
    setSelectedDateStr(dateStr);
  };

  const handleConfirm = () => {
    onSelectDate(selectedDateStr, HINDU_MUHURTHAMS[selectedDateStr]);
    if (onClose) onClose();
  };

  return (
    <View style={styles.calendarContainer}>
      {/* Calendar Header with Month Navigation */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          onPress={goToPrevMonth}
          style={styles.navArrowBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color={THEME.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.monthTitleBox}>
          <Text style={styles.monthTitleText}>
            {MONTH_NAMES[currentMonth]} {currentYear}
          </Text>
          <Text style={styles.panchangamSeason}>
            {currentMonth === 10 || currentMonth === 11
              ? 'Karthika · Margashira Masam'
              : currentMonth === 0 || currentMonth === 1
              ? 'Pushya · Magha Masam'
              : currentMonth === 2 || currentMonth === 3
              ? 'Phalguna · Chaitra Masam'
              : 'Vaisakha · Jyeshtha Masam'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={goToNextMonth}
          style={styles.navArrowBtn}
          activeOpacity={0.7}
        >
          <ChevronRight size={18} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Weekday Row */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_NAMES.map((w, index) => (
          <Text
            key={index}
            style={[
              styles.weekdayText,
              (index === 0 || index === 6) && styles.weekendText,
            ]}
          >
            {w}
          </Text>
        ))}
      </View>

      {/* Day Cells Grid */}
      <View style={styles.grid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`blank-${idx}`} style={styles.dayCellEmpty} />;
          }

          const mm = String(currentMonth + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const cellDateStr = `${currentYear}-${mm}-${dd}`;
          const isSelected = selectedDateStr === cellDateStr;
          const muhurtham = HINDU_MUHURTHAMS[cellDateStr];
          const isMuhurtham = !!muhurtham;

          return (
            <TouchableOpacity
              key={`day-${cellDateStr}`}
              style={[
                styles.dayCell,
                isMuhurtham && styles.dayCellMuhurtham,
                isSelected && styles.dayCellSelected,
              ]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.75}
            >
              {/* Day Number */}
              <View style={styles.dayNumberRow}>
                <Text
                  style={[
                    styles.dayNumber,
                    isMuhurtham && styles.dayNumberMuhurtham,
                    isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {day}
                </Text>
                {isMuhurtham && !isSelected && (
                  <View style={styles.goldDot} />
                )}
              </View>

              {/* Hindu Muhurtham Subtitle in Small Letters */}
              {isMuhurtham ? (
                <Text
                  style={[
                    styles.muhurthamLabel,
                    isSelected && styles.muhurthamLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {muhurtham.name.replace(' Muhurtham', '').replace(' Subha', '')}
                </Text>
              ) : (
                <View style={{ height: 11 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Muhurtham Panchangam Highlight Card */}
      {selectedMuhurtham ? (
        <View style={styles.muhurthamDetailCard}>
          <View style={styles.muhurthamIconBadge}>
            <Sparkles size={14} color="#8C6F34" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.muhurthamTitleRow}>
              <Text style={styles.muhurthamTitleText}>
                {selectedMuhurtham.name}
              </Text>
              <View style={styles.peakBadge}>
                <Text style={styles.peakBadgeText}>SUBHA MUHURTHAM</Text>
              </View>
            </View>
            <Text style={styles.muhurthamSpecsText}>
              {selectedMuhurtham.nakshatram} · {selectedMuhurtham.lagnam} · {selectedMuhurtham.tithi}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.standardDateCard}>
          <Info size={14} color={THEME.colors.textMuted} />
          <Text style={styles.standardDateText}>
            Selected Date: {selectedDateStr} (Standard Event / Reception Day)
          </Text>
        </View>
      )}

      {/* Confirmation Button */}
      <TouchableOpacity
        style={styles.confirmBtn}
        onPress={handleConfirm}
        activeOpacity={0.85}
      >
        <Check size={16} color="#FFFFFF" />
        <Text style={styles.confirmBtnText}>
          Confirm {selectedDateStr}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    width: '100%',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  monthTitleBox: {
    alignItems: 'center',
  },
  monthTitleText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16,
    color: THEME.colors.textPrimary,
  },
  panchangamSeason: {
    fontFamily: THEME.fonts.medium,
    fontSize: 10,
    color: THEME.colors.goldDark,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  weekdayText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 11.5,
    color: THEME.colors.textMuted,
    width: '14.28%',
    textAlign: 'center',
  },
  weekendText: {
    color: THEME.colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 48,
  },
  dayCell: {
    width: '14.28%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 1,
    marginVertical: 1,
  },
  dayCellMuhurtham: {
    backgroundColor: '#FAF6ED',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.35)',
  },
  dayCellSelected: {
    backgroundColor: THEME.colors.accentDark,
    borderColor: THEME.colors.accentDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dayNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayNumber: {
    fontFamily: THEME.fonts.semiBold,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  dayNumberMuhurtham: {
    fontFamily: THEME.fonts.bold,
    color: THEME.colors.goldDark,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontFamily: THEME.fonts.extraBold,
  },
  goldDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.gold,
  },
  muhurthamLabel: {
    fontFamily: THEME.fonts.medium,
    fontSize: 8,
    color: THEME.colors.goldDark,
    textAlign: 'center',
    marginTop: 1,
  },
  muhurthamLabelSelected: {
    color: '#F7E7C4',
    fontFamily: THEME.fonts.bold,
  },
  muhurthamDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FAF6ED',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  muhurthamIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7E7C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  muhurthamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  muhurthamTitleText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  peakBadge: {
    backgroundColor: THEME.colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  peakBadgeText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 8.5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  muhurthamSpecsText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  standardDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  standardDateText: {
    fontFamily: THEME.fonts.medium,
    fontSize: 11.5,
    color: THEME.colors.textSecondary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.accentDark,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 14,
  },
  confirmBtnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
});

