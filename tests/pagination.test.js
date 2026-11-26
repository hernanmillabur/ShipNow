import { expect } from 'chai'
import { paginationMetadata } from '../src/utils/pagination.js'

describe('Pagination metadata', function () {
  it('marks an empty collection at page 1 with no previous or next page', function () {
    expect(paginationMetadata({ page: 1, limit: 20, totalItems: 0 })).to.deep.equal({
      page: 1,
      limit: 20,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    })
  })

  it('does not claim a previous page for an empty collection requested at page 50', function () {
    const result = paginationMetadata({ page: 50, limit: 20, totalItems: 0 })
    expect(result.totalPages).to.equal(0)
    expect(result.hasPreviousPage).to.equal(false)
    expect(result.hasNextPage).to.equal(false)
  })

  it('reports no previous page on the first page when records exist', function () {
    const result = paginationMetadata({ page: 1, limit: 20, totalItems: 5 })
    expect(result.totalPages).to.equal(1)
    expect(result.hasPreviousPage).to.equal(false)
    expect(result.hasNextPage).to.equal(false)
  })

  it('reports both directions on an intermediate page', function () {
    const result = paginationMetadata({ page: 2, limit: 2, totalItems: 5 })
    expect(result.totalPages).to.equal(3)
    expect(result.hasPreviousPage).to.equal(true)
    expect(result.hasNextPage).to.equal(true)
  })

  it('reports a previous page but no next page after the last page', function () {
    const result = paginationMetadata({ page: 4, limit: 2, totalItems: 5 })
    expect(result.totalPages).to.equal(3)
    expect(result.hasPreviousPage).to.equal(true)
    expect(result.hasNextPage).to.equal(false)
  })
})
