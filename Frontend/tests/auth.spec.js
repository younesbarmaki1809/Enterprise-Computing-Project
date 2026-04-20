import { expect, test } from '@playwright/test'

test('login and role redirects', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Email').fill('ava.stone@company.com')
  await page.getByLabel('Password').fill('admin123')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page).toHaveURL(/\/admin\/users$/)

  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Email').fill('mia.shah@company.com')
  await page.getByLabel('Password').fill('user123')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page).toHaveURL(/\/documents$/)
})
