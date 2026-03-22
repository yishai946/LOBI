import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      main: '#7B5EA7', // lavender-purple — matches banner hero
      light: '#A98FD4', // lighter purple for hover states
      dark: '#533A7B', // deeper purple for pressed/active
      contrastText: '#ffffff',
    },

    secondary: {
      main: '#14B8A6', // keeping teal — complements lavender beautifully
      light: '#5EEAD4',
      dark: '#0F766E',
      contrastText: '#ffffff',
    },

    success: {
      main: '#429763',
      light: '#E1FBEB',
    },

    info: {
      main: '#6D4FBF', // shifted to purple-info to stay in family
      light: '#EDE9FB',
    },

    warning: {
      main: '#B45309',
      light: '#FEF3C7',
    },

    error: {
      main: '#CC5252',
      light: '#FEE2E2',
    },

    background: {
      default: '#F5F7FB',
      paper: '#ffffff',
    },

    text: {
      primary: '#120d2e',
      secondary: '#6B7280',
    },

    divider: '#E5E7EB',
  },

  shape: {
    borderRadius: 10,
  },

  typography: {
    fontFamily:
      '"Assistant", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

    h1: {
      fontWeight: 700,
    },

    h2: {
      fontWeight: 600,
    },

    h3: {
      fontWeight: 600,
    },

    h4: {
      fontWeight: 600,
    },

    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 18px',
        },
        contained: {
          color: '#ffffff',
          '&.Mui-disabled': {
            background: '#D9DEE8',
            color: '#5B6474',
          },
        },
        // Contained buttons echo the lavender banner
        containedPrimary: {
          background: 'linear-gradient(135deg, #7B5EA7 0%, #533A7B 100%)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #A98FD4 0%, #7B5EA7 100%)',
          },
          '&.Mui-disabled': {
            background: '#D9DEE8',
            color: '#5B6474',
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: 'rgba(255, 255, 255, 0.22)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.22)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#7B5EA7',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#7B5EA7',
          },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.28)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
        },
      },
    },

    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100vh',
          margin: 0,
          padding: 0,
          backgroundImage: `url('/assets/gradiant.svg')`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          position: 'relative',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },

        '#root': {
          minHeight: '100vh',
        },
      },
    },
  },
});

export default theme;
