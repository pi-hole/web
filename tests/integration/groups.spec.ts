import {test, expect} from "../admin-pages";

test.describe('Groups', async () => {
    test('loads page', async ({ groupsPage }) => {
        await groupsPage.goto();
        await expect(groupsPage.getActiveNavItem).toContainText('Groups')
        await expect(groupsPage.getGroupsList).toBeVisible();
        await expect(groupsPage.getAddGroupForm).toBeVisible();
    })
});
