describe('03. Bina BNI, Magang & Absensi Testing', () => {
  beforeEach(() => {
    cy.loginAsSuperadmin()
  })

  it('Harus memuat halaman Bina BNI dan tabel data', () => {
    cy.visit('/bina')
    cy.contains('Bina BNI').should('be.visible')
    cy.get('table').should('be.visible')
    cy.get('th.sticky.right-0').should('be.visible')
  })

  it('Harus memuat halaman Magang dan fitur input data', () => {
    cy.visit('/magang')
    cy.contains('Magang').should('be.visible')
    cy.get('table').should('be.visible')
    cy.contains('button', 'Tambah').should('be.visible')
  })

  it('Harus memuat halaman Absensi & Cuti', () => {
    cy.visit('/absensi')
    cy.contains('Absensi').should('be.visible')
    cy.get('table').should('be.visible')
  })
})
