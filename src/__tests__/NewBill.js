/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

// Mock pour File (nécessaire pour les tests)
class MockFile {
  constructor(content, name, options) {
    this.content = content;
    this.name = name;
    this.type = options?.type || "";
  }
}

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the NewBill form should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;

      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
    });

    test("Then it should handle file change with valid extension", async () => {
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

      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const mockCreate = jest
        .fn()
        .mockResolvedValue({ fileUrl: "test.jpg", key: "123" });
      const store = {
        bills: jest.fn(() => ({
          create: mockCreate,
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Simuler la sélection d'un fichier valide - méthode alternative
      const fileInput = screen.getByTestId("file");

      // Créer un mock d'événement plus simple
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.jpg",
          files: [{ name: "test.jpg", type: "image/jpeg" }],
        },
      };

      await newBill.handleChangeFile(event);

      expect(mockCreate).toHaveBeenCalled();
    });

    test("Then it should reject file with invalid extension", async () => {
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

      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const mockCreate = jest.fn();
      const store = {
        bills: jest.fn(() => ({
          create: mockCreate,
        })),
      };

      // Mock de alert
      window.alert = jest.fn();

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Simuler la sélection d'un fichier invalide
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.pdf",
          files: [{ name: "test.pdf", type: "application/pdf" }],
        },
      };

      await newBill.handleChangeFile(event);

      expect(window.alert).toHaveBeenCalledWith(
        "Seuls les fichiers JPG, JPEG et PNG sont autorisés"
      );
      expect(mockCreate).not.toHaveBeenCalled();
    });

    test("Then it should handle form submission", () => {
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

      const html = NewBillUI();
      document.body.innerHTML = html;

      const onNavigate = jest.fn();
      const mockUpdate = jest.fn().mockResolvedValue({});
      const store = {
        bills: jest.fn(() => ({
          update: mockUpdate,
        })),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Pré-remplir les données nécessaires
      newBill.fileUrl = "http://test.com/file.jpg";
      // newBill.fileName = "test.jpg";
      // newBill.billId = "123";

      // Simuler la soumission du formulaire en appelant directement handleSubmit
      const event = {
        preventDefault: jest.fn(),
        target: document.querySelector(`form[data-testid="form-new-bill"]`),
      };

      newBill.handleSubmit(event);

      expect(mockUpdate).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });
});
