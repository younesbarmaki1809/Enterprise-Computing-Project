import { expect, test } from '@playwright/test'

test('upload document and add comment flow', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Email').fill('mia.shah@company.com')
  await page.getByLabel('Password').fill('user123')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page).toHaveURL(/\/documents$/)

  const uniqueTitle = `Playwright Upload ${Date.now()}`

  await page.getByRole('button', { name: 'Upload Document' }).click()
  await page.getByLabel('Title').fill(uniqueTitle)
  await page.getByLabel('Category').selectOption({ index: 1 })
  await page.getByLabel('Department').selectOption({ index: 1 })
  await page.getByLabel('Tags (comma separated)').fill('playwright,e2e')
  await page.getByRole('button', { name: 'Save Document' }).click()

  await expect(page.getByText(uniqueTitle)).toBeVisible()
  await page
    .locator('article', { hasText: uniqueTitle })
    .getByRole('link', { name: 'View Details' })
    .click()

  await expect(page).toHaveURL(/\/documents\/\d+$/)

  const comment = `E2E comment ${Date.now()}`
  await page.getByPlaceholder('Write your comment').fill(comment)
  await page.getByRole('button', { name: 'Add Comment' }).click()

  await expect(page.getByText(comment)).toBeVisible()
})
