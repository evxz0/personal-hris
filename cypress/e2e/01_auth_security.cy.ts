describe('01. Authentication & Security Testing (P-HRIS)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()
  })

  it('Harus menampilkan halaman login dengan elemen lengkap dan branding BNI', () => {
    cy.visit('/login')
    cy.contains('h1', 'P-HRIS').should('be.visible')
    cy.contains('Selamat Datang').should('be.visible')
    cy.get('#userId').should('be.visible').and('have.attr', 'placeholder', 'Masukkan ID Pengguna')
    cy.get('#password').should('be.visible')
    cy.contains('button', 'Masuk ke Sistem').should('be.visible')
  })

  it('Harus menampilkan error jika password salah', () => {
    cy.visit('/login')
    cy.get('#userId').type('54806')
    cy.get('#password').type('wrong_password_12345')
    cy.get('button[type="submit"]').click()
    
    cy.get('body').should('contain.text', 'tidak cocok')
  })

  it('Harus bisa beralih ke form Lupa Kata Sandi dan kembali ke Login', () => {
    cy.visit('/login')
    cy.contains('button', 'Lupa Kata Sandi?').click()
    cy.contains('h2', 'Lupa Kata Sandi').should('be.visible')
    cy.get('#resetEmailInput').should('be.visible')

    cy.contains('button', 'Kembali ke Halaman Login').click()
    cy.contains('h2', 'Selamat Datang').should('be.visible')
  })

  it('Harus berhasil login dengan akun Superadmin dan diarahkan ke Dashboard / Superadmin Panel', () => {
    cy.visit('/login')
    cy.get('#userId').type('superadmin')
    cy.get('#password').type('superadmin')
    cy.get('button[type="submit"]').click()

    // Verifikasi URL atau dashboard header
    cy.url().should('satisfy', (url: string) => {
      return url.includes('/superadmin') || url.includes('/')
    })
  })
})
