export default async function run(page) {
  await page.addInitScript(() => {
    localStorage.setItem("tenantUser", JSON.stringify({ id: 1, business_name: "QA" }));
  });
  await page.goto("https://netkitonga.com/routers");
  await page.waitForFunction(() => document.body.innerText.includes("ROUTERS REGISTRY"));
  const beforeReload = await page.evaluate(() => ({
    path: location.pathname,
    headingVisible: document.body.innerText.includes("ROUTERS REGISTRY"),
  }));
  await page.reload();
  await page.waitForFunction(() => document.body.innerText.includes("ROUTERS REGISTRY"));
  return {
    beforeReload,
    afterReload: await page.evaluate(() => ({
      path: location.pathname,
      headingVisible: document.body.innerText.includes("ROUTERS REGISTRY"),
      bodyText: document.body.innerText.slice(-300),
    })),
  };
}
