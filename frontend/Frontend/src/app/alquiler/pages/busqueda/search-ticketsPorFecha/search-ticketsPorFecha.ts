import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../services/busqueda-avanzada.service';
import { TicketFull } from '../../../interfaces/search.interface';
import { ListItem } from '../../../components/list-item/list-item';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasTickets: boolean;
  ticketCount: number;
}

@Component({
  selector: 'app-search-tickets-por-fecha',
  standalone: true,
  imports: [CommonModule, FormsModule, ListItem],
  templateUrl: './search-ticketsPorFecha.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTicketsPorFecha { 
  private ticketService = inject(TicketService);
  
  // Signals
  allTickets = signal<TicketFull[]>([]);
  isLoading = signal(true);
  selectedDate = signal<Date | null>(null);
  currentMonth = signal<Date>(new Date());
  
  // Días de la semana
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Computed para el calendario
  calendarDays = computed(() => {
    const current = this.currentMonth();
    const year = current.getFullYear();
    const month = current.getMonth();
    
    // Primer y último día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Días a mostrar antes del primer día del mes
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = this.selectedDate();
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        hasTickets: this.hasTicketsOnDate(date),
        ticketCount: this.getTicketCountOnDate(date)
      });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.getTime() === today.getTime();
      const isSelected = selected ? date.getTime() === selected.getTime() : false;
      
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday,
        isSelected,
        hasTickets: this.hasTicketsOnDate(date),
        ticketCount: this.getTicketCountOnDate(date)
      });
    }
    
    // Días del mes siguiente para completar la grilla
    const remainingDays = 42 - days.length; // 6 semanas x 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        hasTickets: this.hasTicketsOnDate(date),
        ticketCount: this.getTicketCountOnDate(date)
      });
    }
    
    return days;
  });
  
  // Computed para tickets filtrados por fecha seleccionada
  filteredTickets = computed(() => {
    const selected = this.selectedDate();
    const tickets = this.allTickets();
    
    if (!selected) {
      return tickets;
    }
    
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.fechaIngreso);
      
      // Normalizar ambas fechas a medianoche en zona horaria local
      const normalizedTicket = new Date(
        ticketDate.getFullYear(),
        ticketDate.getMonth(),
        ticketDate.getDate()
      );
      
      const normalizedSelected = new Date(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate()
      );
      
      const matches = normalizedTicket.getTime() === normalizedSelected.getTime();
      
      return matches;
    });
  });
  
  // Computed para el nombre del mes actual
  currentMonthName = computed(() => {
    const date = this.currentMonth();
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  });

  ngOnInit(): void {
    this.loadTickets();
  }

  // Navegar al mes anterior
  previousMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  // Navegar al mes siguiente
  nextMonth() {
    const current = this.currentMonth();
    this.currentMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  // Ir al mes actual
  goToToday() {
    this.currentMonth.set(new Date());
    this.selectedDate.set(new Date());
  }

  // Seleccionar un día (permite cualquier día, incluso de meses anteriores)
  selectDay(day: CalendarDay) {
    this.selectedDate.set(day.date);
    // Si se selecciona un día de otro mes, navegar a ese mes
    if (!day.isCurrentMonth) {
      this.currentMonth.set(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
    }
  }

  // Limpiar selección
  clearSelection() {
    this.selectedDate.set(null);
  }

  // Verificar si hay tickets en una fecha
  private hasTicketsOnDate(date: Date): boolean {
    const tickets = this.allTickets();
    
    const normalizedCheck = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    
    return tickets.some(ticket => {
      const ticketDate = new Date(ticket.fechaIngreso);
      const normalizedTicket = new Date(
        ticketDate.getFullYear(),
        ticketDate.getMonth(),
        ticketDate.getDate()
      );
      return normalizedTicket.getTime() === normalizedCheck.getTime();
    });
  }

  // Obtener cantidad de tickets en una fecha
  private getTicketCountOnDate(date: Date): number {
    const tickets = this.allTickets();
    
    const normalizedCheck = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.fechaIngreso);
      const normalizedTicket = new Date(
        ticketDate.getFullYear(),
        ticketDate.getMonth(),
        ticketDate.getDate()
      );
      return normalizedTicket.getTime() === normalizedCheck.getTime();
    }).length;
  }

  private loadTickets() {
    this.isLoading.set(true);
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.allTickets.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar tickets:', error);
        this.isLoading.set(false);
      }
    });
  }
}
