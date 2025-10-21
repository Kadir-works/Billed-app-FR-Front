/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      // ✅ CORRECTION : Ajout de l'expect manquant
      expect(windowIcon.className).toContain("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Then clicking on new bill button should navigate to NewBill page", () => {
      // Setup
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = {};

      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Simuler le clic sur le bouton
      const newBillButton = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillButton);

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("Then clicking on eye icon should open modal", () => {
      // Setup
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = {};

      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Mock de jQuery modal
      $.fn.modal = jest.fn();

      // Simuler le clic sur l'icône eye
      const eyeIcons = screen.getAllByTestId("icon-eye");
      if (eyeIcons.length > 0) {
        fireEvent.click(eyeIcons[0]);
        expect($.fn.modal).toHaveBeenCalledWith("show");
      }
    });

    test("Then getBills should return formatted bills", async () => {
      // Setup
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.com",
        })
      );

      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const mockBills = [
        {
          id: "1",
          date: "2024-01-01",
          status: "pending",
          name: "Test Bill 1",
          amount: 100,
          type: "Transports",
        },
        {
          id: "2",
          date: "2024-01-02",
          status: "accepted",
          name: "Test Bill 2",
          amount: 200,
          type: "Restaurants",
        },
      ];

      const mockList = jest.fn().mockResolvedValue(mockBills);
      const store = {
        bills: jest.fn(() => ({
          list: mockList,
        })),
      };

      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Tester la méthode getBills
      const result = await billsContainer.getBills();

      expect(result).toHaveLength(2);
      expect(result[0].date).toBeDefined();
      expect(result[0].status).toBeDefined();
      expect(mockList).toHaveBeenCalled(); // ✅ Vérifier l'appel
    });

    test("Then getBills should handle store undefined", () => {
      // Setup
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const store = null; // Store undefined

      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Tester getBills avec store undefined
      const result = billsContainer.getBills();

      expect(result).toBeUndefined();
    });
  });
});
