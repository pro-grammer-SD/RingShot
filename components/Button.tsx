import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-wider relative overflow-hidden group";
  
  const variants = {
    primary: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] border border-fuchsia-400",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white border border-gray-600",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]",
    icon: "bg-transparent hover:bg-white/10 text-white p-2 rounded-full",
  };
  
  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-xl",
  };

  const finalVariant = variants[variant];
  const finalSize = variant === 'icon' ? '' : sizes[size];

  return (
    <button 
      className={`${baseStyle} ${finalVariant} ${finalSize} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {variant !== 'icon' && (
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
      )}
    </button>
  );
};