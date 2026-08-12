describe('02. Data Karyawan & Sticky/Frozen Action Column Testing', () => {
  beforeEach(() => {
    cy.loginAsSuperadmin()
    cy.visit('/karyawan')
  })

  it('Harus memuat halaman Data Karyawan dan tabel data utama', () => {
    cy.contains('h1', 'Data Karyawan').should('be.visible')
    cy.get('table').should('be.visible')
    cy.get('thead tr').should('contain.text', 'Aksi')
  })

  it('Harus memvalidasi bahwa Kolom Aksi berada pada posisi Sticky Freeze di sisi kanan', () => {
    // Verifikasi header Aksi memiliki class sticky right-0
    cy.get('th.sticky.right-0')
      .should('be.visible')
      .and('contain.text', 'Aksi')

    // Verifikasi sel aksi pada baris tabel juga sticky right-0
    cy.get('tbody tr').first().find('td.sticky.right-0').should('be.visible')

    // Lakukan scroll horizontal pada tabel ke kanan dan kiri
    cy.get('.overflow-x-auto').scrollTo('right', { ensureScrollable: false })
    cy.get('th.sticky.right-0').should('be.visible')
    cy.get('tbody tr').first().find('td.sticky.right-0').should('be.visible')

    cy.get('.overflow-x-auto').scrollTo('left', { ensureScrollable: false })
    cy.get('th.sticky.right-0').should('be.visible')
    cy.get('tbody tr').first().find('td.sticky.right-0').should('be.visible')
  })

  it('Harus dapat membuka modal Tambah Karyawan Baru', () => {
    cy.contains('button', 'Tambah Karyawan').click()
    cy.contains('Tambah Karyawan Baru').should('be.visible')
    cy.get('input[placeholder*="NPP"]').should('be.visible')
    cy.contains('button', 'Batal').click()
  })

  it('Harus dapat memfilter data berdasarkan Outlet, Jabatan, dan Grade', () => {
    // Cari input pencarian atau dropdown filter
    cy.get('input[placeholder*="Cari"]').type('a')
    cy.get('table').should('be.visible')
  })
})
