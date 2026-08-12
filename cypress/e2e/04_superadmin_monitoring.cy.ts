describe('04. Superadmin Control & Realtime Monitoring Center Testing', () => {
  beforeEach(() => {
    cy.loginAsSuperadmin()
    cy.visit('/superadmin')
  })

  it('Harus menampilkan dashboard Superadmin dengan metrik telemetry', () => {
    cy.contains('Superadmin Control & Monitoring Center').should('be.visible')
    cy.contains('Total Sesi Login Aktif').should('be.visible')
    cy.contains('Perangkat Desktop').should('be.visible')
    cy.contains('Perangkat Mobile / Tablet').should('be.visible')
  })

  it('Harus menampilkan daftar sesi dan perangkat dengan status ONLINE', () => {
    cy.contains('Daftar Pengguna & Perangkat yang Sedang Login').should('be.visible')
    cy.get('table').should('be.visible')
    cy.contains('span', 'ONLINE').should('be.visible')
    cy.contains('button', 'Putuskan Sesi').should('be.visible')
  })

  it('Harus dapat beralih ke tab Manajemen Akun User dan membuka Modal Tambah Pengguna', () => {
    cy.contains('button', 'Manajemen Akun User').click()
    cy.contains('Daftar Pengguna P-HRIS').should('be.visible')
    cy.contains('button', 'Tambah Pengguna').click()
    cy.contains('Buat Akun Pengguna Baru').should('be.visible')
    cy.contains('button', 'Batal').click()
  })

  it('Harus dapat beralih ke tab Log Aktivitas & Audit', () => {
    cy.contains('button', 'Log Aktivitas & Audit').click()
    cy.contains('Audit Log & Rekam Jejak Operasi').should('be.visible')
    cy.get('table').should('be.visible')
  })

  it('Harus dapat beralih ke tab Grafik Server & Latency', () => {
    cy.contains('button', 'Grafik Server & Ping').click()
    cy.contains('Latency Server Realtime').should('be.visible')
  })
})
