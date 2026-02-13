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
			/* Major Second (1.125) type scale */
			'xs': ['0.79rem', { lineHeight: '1.4' }],      /* ~13px - caption */
			'sm': ['0.889rem', { lineHeight: '1.5' }],     /* ~14px - small */
			'base': ['1rem', { lineHeight: '1.6' }],       /* 16px  - body */
			'lg': ['1.424rem', { lineHeight: '1.5' }],     /* ~23px - h4 */
			'xl': ['1.602rem', { lineHeight: '1.4' }],     /* ~26px - h3 */
			'2xl': ['1.802rem', { lineHeight: '1.3' }],    /* ~29px - h2 */
			'3xl': ['2.027rem', { lineHeight: '1.2' }],    /* ~32px - h1 */
			'4xl': ['2.281rem', { lineHeight: '1.1' }],    /* ~37px - display */
			'code': ['0.9375rem', { lineHeight: '1.5' }],  /* 15px  - monospace */
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
				border: 'hsl(var(--border-primary))',
				'border-primary': 'hsl(var(--border-primary))',
				'border-secondary': 'hsl(var(--border-secondary))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background-main))',
				'background-main': 'hsl(var(--background-main))',
				'background-header': 'hsl(var(--background-header))',
				'background-primary': 'hsl(var(--background-primary))',
				'background-muted': 'hsl(var(--background-muted))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
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
				attention: {
					DEFAULT: 'hsl(var(--attention))',
					foreground: 'hsl(var(--attention-foreground))'
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
