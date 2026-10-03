import { expect, test, type Page } from "@playwright/test";

// Сквозной сценарий: гость записывается на свободный слот, владелец видит встречу,
// занятое время второй раз не бронируется.

const openFirstSlot = async (page: Page, eventTitle: string) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Выбрать время" }).click();
  await page.getByRole("listitem").filter({ hasText: eventTitle }).getByRole("link").click();
  await expect(page.getByRole("heading", { name: eventTitle })).toBeVisible();
  const slot = page.getByRole("list", { name: "Свободное время" }).getByRole("button").first();
  const time = await slot.textContent();
  await slot.click();
  return time;
};

const fillGuest = async (page: Page, name: string) => {
  await page.getByLabel("Имя").fill(name);
  await page.getByLabel("Почта").fill(`${name.toLowerCase()}@example.com`);
  await page.getByRole("button", { name: "Записаться" }).click();
};

test("guest books a free slot and the owner sees the meeting", async ({ page }) => {
  const time = await openFirstSlot(page, "Знакомство");
  await fillGuest(page, "Anna");

  await expect(page.getByRole("status")).toContainText("Вы записаны");
  await expect(page.getByRole("status")).toContainText(time ?? "");

  await page.getByRole("link", { name: "Встречи" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Anna" })).toContainText("Знакомство");
});

test("a slot taken meanwhile is not booked twice", async ({ page, request }) => {
  await openFirstSlot(page, "Консультация");
  const slots = await (await request.get("/api/event-types/consultation/slots")).json();

  // Пока гость заполняет форму, это время занимает другой клиент через API
  const taken = await request.post("/api/bookings", {
    data: {
      eventTypeId: "intro-call",
      start: slots[0].start,
      guestName: "Other",
      guestEmail: "other@example.com",
    },
  });
  expect(taken.status()).toBe(201);

  await fillGuest(page, "Boris");

  await expect(page.getByRole("alert")).toContainText("Это время уже занято");
  await expect(page.getByRole("status")).toHaveCount(0);
});
