import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#2563EB",
      light: "#60A5FA",
      dark: "#1E40AF",
      contrastText: "#ffffff",
    },

    secondary: {
      main: "#14B8A6",
      light: "#5EEAD4",
      dark: "#0F766E",
      contrastText: "#ffffff",
    },

    success: {
      main: "#16A34A",
    },

    warning: {
      main: "#F59E0B",
    },

    error: {
      main: "#DC2626",
    },

    background: {
      default: "#F5F7FB",
      paper: "#ffffff",
    },

    text: {
      primary: "#111827",
      secondary: "#6B7280",
    },

    divider: "#E5E7EB",
  },

  shape: {
    borderRadius: 10,
  },

  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',

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
      textTransform: "none",
      fontWeight: 600,
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 18px",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          borderBottom: "1px solid #E5E7EB",
        },
      },
    },
  },
});

export default theme;
