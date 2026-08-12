describe('05. Export Data & Generator Surat SK Testing', () => {
  beforeEach(() => {
    cy.loginAsSuperadmin()
  })

  it('Harus memuat halaman Generator Surat SK', () => {
    cy.visit('/surat')
    cy.contains('Generator Surat').should('be.visible')
  })

  it('Harus memuat halaman Riwayat Surat yang telah diterbitkan', () => {
    cy.visit('/riwayat-surat')
    cy.contains('Riwayat').should('be.visible')
    cy.get('table').should('be.visible')
  })
})
