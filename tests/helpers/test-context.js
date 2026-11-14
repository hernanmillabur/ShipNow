let app

export const setTestApp = (expressApp) => {
  app = expressApp
}

export const getTestApp = () => {
  if (!app) throw new Error('La aplicación Express no fue inicializada para testing')
  return app
}

export const clearTestApp = () => {
  app = undefined
}
