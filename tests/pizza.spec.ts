import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('about page', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page.getByRole('main')).toContainText('The secret sauce');
});

test('docs page', async ({ page }) => {
  await page.goto('http://localhost:5173/docs');
  await expect(page.getByRole('main')).toContainText('JWT Pizza API');
  await expect(page.getByText('[POST] /api/authRegister a')).toBeVisible();
  await expect(page.getByText('🔐 [DELETE] /api/franchise/:franchiseId/store/:storeIdDelete a storeExample')).toBeVisible();
});

test('unknown page', async ({ page }) => {
  await page.goto('http://localhost:5173/sharon');
  await expect(page.getByRole('heading')).toContainText('Oops');
  await expect(page.getByRole('main')).toContainText('It looks like we have dropped a pizza on the floor. Please try another page.');
});

test('login and logout', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'diner' };
    const loginRes = {
      user: {
        id: 11,
        name: 'pizza diner',
        email: 'd@jwt.com',
        roles: [
          {
            role: 'diner',
          },
        ],
      },
    };
    const logoutRes = { message: 'logout successful' };
    if (route.request().method() === 'PUT') {
      expect(route.request().postDataJSON()).toMatchObject(loginReq);
      await route.fulfill({ json: loginRes });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ json: logoutRes });
    } else {
      throw new Error('Unexpected request');
    }
  });
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.locator('#navbar-dark')).toContainText('Login');
});

test('purchase with login', async ({ page }) => {
  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      { id: 1, title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
      { id: 2, title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('*/**/api/franchise', async (route) => {
    const franchiseRes = [
      {
        id: 2,
        name: 'LotaPizza',
        stores: [
          { id: 4, name: 'Lehi' },
          { id: 5, name: 'Springville' },
          { id: 6, name: 'American Fork' },
        ],
      },
      { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
      { id: 4, name: 'topSpot', stores: [] },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = { id: 3, name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        { menuId: 1, description: 'Veggie', price: 0.0038 },
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
      ],
      storeId: '4',
      franchiseId: 2,
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 1, description: 'Veggie', price: 0.0038 },
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        ],
        storeId: '4',
        franchiseId: 2,
        id: 23,
      },
      jwt: 'eyJpYXQ',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.goto('http://localhost:5173/');

  // Go to order page
  await page.getByRole('button', { name: 'Order now' }).click();

  // Create order
  await expect(page.locator('h2')).toContainText('Awesome is a click away');
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Order now' }).click();
  await page.getByRole('combobox').selectOption('4');
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Login
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  // Pay
  await expect(page.getByRole('main')).toContainText('Send me those 2 pizzas right now!');
  await expect(page.locator('tbody')).toContainText('Veggie');
  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await expect(page.locator('tfoot')).toContainText('0.008 ₿');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Check balance
  await expect(page.getByText('0.008')).toBeVisible();
});

test('register new user', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const registerReq = { name: 'test', email: 'test@test', password: 'test' };
    const registerRes = {
      user: {
        name: 'test',
        email: 'test@test',
        roles: [
          {
            role: 'diner',
          },
        ],
        id: 22,
      },
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(registerReq);
    await route.fulfill({ json: registerRes });
  });

  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Register' }).click();
  await expect(page.getByRole('heading')).toContainText('Welcome to the party');
  await page.getByPlaceholder('Full name').fill('test');
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('test@test');
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill('test');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('heading')).toContainText("The web's best pizza");
});

test('view admin dashboard', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'admin@admin.com', password: 'admin' };
    const loginRes = {
      user: {
        id: 1,
        name: 'Samuel',
        email: 'admin@admin.com',
        roles: [
          {
            role: 'admin',
          },
        ],
      },
      token: 'fakeToken',
    };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('admin@admin.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();
  await expect(page.getByRole('heading')).toContainText("Mama Ricci's kitchen");
});

test('view franchise dashboard', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'f@jwt.com', password: 'franchisee' };
    const loginRes = {
      user: {
        id: 3,
        name: 'pizza franchisee',
        email: 'f@jwt.com',
        roles: [
          {
            role: 'franchisee',
          },
        ],
      },
    };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  let callCount = 0;
  await page.route('*/**/api/franchise/*', async (route) => {
    callCount += 1;
    let franchiseRes;
    if (callCount === 1) {
      franchiseRes = [
        {
          id: 1,
          name: 'pizzaPocket',
          admins: [
            {
              id: 3,
              name: 'pizza franchisee',
              email: 'f@jwt.com',
            },
          ],
          stores: [],
        },
      ];
    } else {
      [
        {
          id: 1,
          name: 'pizzaPocket',
          admins: [
            {
              id: 3,
              name: 'pizza franchisee',
              email: 'f@jwt.com',
            },
          ],
          stores: [
            {
              id: 1,
              name: 'Elephant',
              totalRevenue: 0,
            },
          ],
        },
      ];
    }
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });
  await page.route('*/**/api/franchise/1/store', async (route) => {
    const storeReq = {
      name: 'Elephant',
    };
    const storeRes = [
      {
        id: 1,
        franchiseId: 1,
        name: 'Elephant',
      },
    ];
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(storeReq);
    await route.fulfill({ json: storeRes });
  });

  await page.goto('http://localhost:5173/');
  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByRole('main')).toContainText('So you want a piece of the pie?');
  await page.getByText('If you are already a').click();
  await expect(page.getByRole('alert')).toContainText('If you are already a franchisee, pleaseloginusing your franchise account');
  await page.getByRole('link', { name: 'login', exact: true }).click();
  await page.getByPlaceholder('Email address').fill('f@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('main')).toContainText('Everything you need to run an JWT Pizza franchise. Your gateway to success.');
  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByPlaceholder('store name').click();
  await page.getByPlaceholder('store name').fill('Elephant');
  await page.getByRole('button', { name: 'Create' }).click();
  // await expect(page.locator('tbody')).toContainText('Elephant');
  // await page.getByRole('button', { name: 'Close' }).nth(0).click();
  // await expect(page.getByRole('heading')).toContainText('Sorry to see you go');
  // await expect(page.getByRole('main')).toContainText('Close');
});

test('view diner dashboard', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'diner' };
    const loginRes = {
      user: {
        id: 11,
        name: 'pizza diner',
        email: 'd@jwt.com',
        roles: [
          {
            role: 'diner',
          },
        ],
      },
    };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });
  await page.route('*/**/api/order', async (route) => {
    const orderRes = {
      dinerId: 2,
      orders: [
        {
          id: 5,
          franchiseId: 1,
          storeId: 1,
          date: '2024-06-14T21:34:29.000Z',
          items: [
            {
              id: 8,
              menuId: 1,
              description: 'Veggie',
              price: 0.05,
            },
          ],
        },
        {
          id: 6,
          franchiseId: 1,
          storeId: 1,
          date: '2024-06-14T21:35:29.000Z',
          items: [
            {
              id: 9,
              menuId: 1,
              description: 'Veggie',
              price: 0.05,
            },
          ],
        },
        {
          id: 7,
          franchiseId: 1,
          storeId: 1,
          date: '2024-06-14T21:37:15.000Z',
          items: [
            {
              id: 10,
              menuId: 1,
              description: 'Veggie',
              price: 0.05,
            },
          ],
        },
      ],
      page: 1,
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: orderRes });
  });
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Email address').press('Tab');
  await page.getByPlaceholder('Password').fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole('heading')).toContainText('Your pizza kitchen');
  await expect(page.getByRole('main')).toContainText('pizza diner');
  await expect(page.getByRole('main')).toContainText('Here is your history of all the good times.');
  await expect(page.locator('thead')).toContainText('ID');
  await expect(page.locator('thead')).toContainText('Price');
  await expect(page.locator('thead')).toContainText('Date');
  await expect(page.locator('tbody')).toContainText('0.05 ₿');
});
