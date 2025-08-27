import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontSize: {
				/* Enhanced font sizes for senior accessibility */
				'xs': ['0.875rem', { lineHeight: '1.5' }], /* 14px */
				'sm': ['0.9375rem', { lineHeight: '1.5' }], /* 15px - larger than default */
				'base': ['1rem', { lineHeight: '1.6' }], /* 16px - minimum for seniors */
				'lg': ['1.125rem', { lineHeight: '1.6' }], /* 18px */
				'xl': ['1.25rem', { lineHeight: '1.5' }], /* 20px */
				'2xl': ['1.5rem', { lineHeight: '1.4' }], /* 24px */
				'3xl': ['1.875rem', { lineHeight: '1.3' }], /* 30px */
				'4xl': ['2.25rem', { lineHeight: '1.2' }], /* 36px */
				'5xl': ['3rem', { lineHeight: '1.1' }], /* 48px */
				'6xl': ['3.75rem', { lineHeight: '1' }], /* 60px */
			},
			spacing: {
				/* Enhanced spacing for better touch targets */
				'18': '4.5rem', /* 72px */
				'22': '5.5rem', /* 88px */
				'26': '6.5rem', /* 104px */
				'30': '7.5rem', /* 120px */
			},
			minHeight: {
				/* Minimum sizes for accessibility */
				'touch': '2.75rem', /* 44px - minimum touch target */
				'button': '2.75rem', /* 44px */
				'input': '2.75rem', /* 44px */
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					dark: 'hsl(var(--primary-dark))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				'progress-bg': 'hsl(var(--progress-bg))',
				'progress-fill': 'hsl(var(--progress-fill))',
				'deadline-overdue': 'hsl(var(--deadline-overdue))',
				'deadline-warning': 'hsl(var(--deadline-warning))',
				'deadline-upcoming': 'hsl(var(--deadline-upcoming))',
				'deadline-completed': 'hsl(var(--deadline-completed))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-card': 'var(--gradient-card)'
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'card': 'var(--shadow-card)'
			},
			transitionTimingFunction: {
				'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
				'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'progress-fill': {
					from: { width: '0%' },
					to: { width: 'var(--progress-width)' }
				},
				'slide-in': {
					from: { opacity: '0', transform: 'translateY(10px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'progress-fill': 'progress-fill 1s ease-out',
				'slide-in': 'slide-in 0.3s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
