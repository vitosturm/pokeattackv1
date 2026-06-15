import { test, expect } from '@playwright/test';

test('homepage loads and routes to battle', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/POKEATTACK/i)).toBeVisible();
  await page.getByRole('button', { name: /play now — go to battle/i }).click();
  await expect(page).toHaveURL(/\/battle/);
});
