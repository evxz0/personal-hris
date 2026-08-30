/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login to TALOS
     * @example cy.login('superadmin', 'password')
     */
    login(username?: string, password?: string): Chainable<void>

    /**
     * Custom command to login directly as Superadmin
     * @example cy.loginAsSuperadmin()
     */
    loginAsSuperadmin(): Chainable<void>

    /**
     * Set viewport to standard desktop resolution
     */
    setDesktopViewport(): Chainable<void>

    /**
     * Set viewport to mobile resolution (e.g. Android phone)
     */
    setMobileViewport(): Chainable<void>
  }
}

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 800)
})

Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(390, 844) // iPhone 12/13/14 or typical modern mobile screen
})

Cypress.Commands.add('login', (username = 'superadmin', password = 'Superadmin09908') => {
  cy.visit('/login')
  cy.get('#userId').clear().type(username)
  cy.get('#password').clear().type(password)
  cy.get('button[type="submit"]').contains(/Masuk ke Sistem/i).click()
})

Cypress.Commands.add('loginAsSuperadmin', () => {
  cy.visit('/login')
  cy.get('#userId').clear().type('superadmin')
  cy.get('#password').clear().type('Superadmin09908')
  cy.get('button[type="submit"]').contains(/Masuk ke Sistem/i).click()
})