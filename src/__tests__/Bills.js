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

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Lorsque je suis sur la page Bills", () => {
    test("Alors l'icône de note de frais dans la barre latérale devrait être mise en surbrillance", async () => {
      // Configuration de l'environnement de test
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Création de la structure HTML de base
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      // Initialisation du routeur et navigation
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Attente du chargement de l'interface
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      // Vérification que l'icône est active
      expect(windowIcon.className).toContain("active-icon");
    });

    test("Alors les notes de frais devraient être triées de la plus récente à la plus ancienne", () => {
      // Affichage de l'interface Bills avec les données de test
      document.body.innerHTML = BillsUI({ data: bills });

      // Récupération de toutes les dates affichées
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);

      // Fonction de tri anti-chronologique
      const antiChrono = (a, b) => (a < b ? 1 : -1);

      // Création d'une copie triée des dates
      const datesSorted = [...dates].sort(antiChrono);

      // Vérification que l'affichage correspond au tri attendu
      expect(dates).toEqual(datesSorted);
    });

    test("Alors cliquer sur le bouton 'Nouvelle note' devrait naviguer vers la page NewBill", () => {
      // Configuration de l'utilisateur connecté
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Affichage de l'interface
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      // Création des mocks pour la navigation et le store
      const onNavigate = jest.fn();
      const store = {};

      // Instanciation du container Bills
      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Simulation du clic sur le bouton "Nouvelle note de frais"
      const newBillButton = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillButton);

      // Vérification que la navigation a été déclenchée vers la bonne page
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    test("Alors cliquer sur l'icône 'œil' devrait ouvrir la modale de visualisation", () => {
      // Configuration de l'utilisateur connecté
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Affichage de l'interface
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;

      // Création des mocks
      const onNavigate = jest.fn();
      const store = {};

      // Instanciation du container Bills
      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Mock de la fonction modal de jQuery (utilisée pour afficher la modale)
      $.fn.modal = jest.fn();

      // Récupération de toutes les icônes "œil" et clic sur la première
      const eyeIcons = screen.getAllByTestId("icon-eye");
      if (eyeIcons.length > 0) {
        fireEvent.click(eyeIcons[0]);

        // Vérification que la modale a été ouverte
        expect($.fn.modal).toHaveBeenCalledWith("show");
      }
    });

    test("Alors getBills devrait retourner les notes de frais formatées", async () => {
      // Configuration de l'utilisateur connecté avec email
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

      // Affichage d'une interface vide
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      // Création des mocks avec des données de test
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

      // Mock de la fonction list qui retourne les données de test
      const mockList = jest.fn().mockResolvedValue(mockBills);
      const store = {
        bills: jest.fn(() => ({
          list: mockList,
        })),
      };

      // Instanciation du container
      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Appel de la méthode getBills et attente du résultat
      const result = await billsContainer.getBills();

      // Vérifications des résultats
      expect(result).toHaveLength(2); // 2 notes retournées
      expect(result[0].date).toBeDefined(); // Date formatée
      expect(result[0].status).toBeDefined(); // Statut formaté
      expect(mockList).toHaveBeenCalled(); // API appelée
    });

    test("Alors getBills devrait gérer le cas où le store est undefined", () => {
      // Configuration de l'utilisateur connecté
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      // Affichage d'une interface vide
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      // Création des mocks avec store null
      const onNavigate = jest.fn();
      const store = null; // Store undefined pour tester le cas d'erreur

      // Instanciation du container
      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Appel de getBills avec store undefined
      const result = billsContainer.getBills();

      // Vérification que rien n'est retourné (comportement attendu)
      expect(result).toBeUndefined();
    });
  });
});
