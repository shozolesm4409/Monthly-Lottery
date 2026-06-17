import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export const showSuccessAlert = (message: string, isDark: boolean = true) => {
  return Swal.fire({
    title: 'সফল হয়েছে!',
    text: message,
    icon: 'success',
    background: isDark ? '#0d0d0d' : '#ffffff',
    color: isDark ? '#f3f4f6' : '#111827',
    confirmButtonColor: '#f59e0b', // Amber-500
    confirmButtonText: 'ঠিক আছে',
    timer: 4000,
    timerProgressBar: true,
    heightAuto: false,
    customClass: {
      popup: 'font-sans rounded-2xl border ' + (isDark ? 'border-[#1a1a1a] shadow-2xl' : 'border-gray-200 shadow-lg'),
    }
  });
};

export const showErrorAlert = (message: string, isDark: boolean = true) => {
  return Swal.fire({
    title: 'ত্রুটি!',
    text: message,
    icon: 'error',
    background: isDark ? '#0d0d0d' : '#ffffff',
    color: isDark ? '#f3f4f6' : '#111827',
    confirmButtonColor: '#ef4444', // Rose-500
    confirmButtonText: 'ঠিক আছে',
    heightAuto: false,
    customClass: {
      popup: 'font-sans rounded-2xl border ' + (isDark ? 'border-[#1a1a1a] shadow-2xl' : 'border-gray-200 shadow-lg'),
    }
  });
};
