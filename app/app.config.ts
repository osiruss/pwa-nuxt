export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      neutral: 'slate',
      warning: 'amber',   // acento tipo naranja corporativo
      success: 'green',
      error: 'red'
    },

    // Ajustes globales de estilo
    icons: {
      dynamic: true
    },

    button: {
      default: {
        size: 'sm',
        variant: 'solid'
      }
    },

    alert: {
      default: {
        variant: 'soft'
      }
    },

    badge: {
      default: {
        variant: 'soft'
      }
    },

    card: {
      base: 'rounded-2xl shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800'
    },

    modal: {
      base: 'rounded-2xl'
    }
  }
})
