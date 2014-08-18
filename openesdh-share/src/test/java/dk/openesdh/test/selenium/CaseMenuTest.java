package dk.openesdh.test.selenium;

import dk.openesdh.test.selenium.framework.Browser;
import dk.openesdh.test.selenium.framework.Pages;
import dk.openesdh.test.selenium.framework.enums.User;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;


/**
 * This testcase requires:
 * -user admin with password admin
 * -user alice with password alice
 * -user invalid with password invalid NOT TO EXIST!
 * @author Søren Kirkegård
 *
 */
public class CaseMenuTest {

    @BeforeClass
    public static void setUpBeforeClass() {
        Browser.initialize();
    }

    @Test
    public void testCaseMenuIsVisibleAndClickable() {
        Pages.Login.loginWith(User.ADMIN);
        assertTrue(Pages.Dashboard.isAt(User.ADMIN));
        WebElement menuItem = Browser.Driver.findElement(By.id("HEADER_CUSTOM_DROPDOWN_text"));
        assertNotNull( menuItem );

        WebElement searchLinkItem = Browser.Driver.findElement(By.id("CASE_MENU_SEARCH_LINK_text"));
        assertNotNull( searchLinkItem );
    }

    @After
    public void tearDown() {
        Pages.Login.logout();
    }

    @AfterClass
    public static void tearDownAfterClass() {
        Browser.Driver.close();
    }

}
