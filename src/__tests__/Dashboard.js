/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import DashboardFormUI from "../views/DashboardFormUI.js";
import DashboardUI from "../views/DashboardUI.js";
import Dashboard, { filteredBills, cards } from "../containers/Dashboard.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills";
import router from "../app/Router";

// Remplacement du store réel par un mock pour isoler les tests
jest.mock("../app/store", () => mockStore);

describe("Étant donné que je suis connecté en tant qu'Administrateur", () => {
  describe("Lorsque je suis sur la page Dashboard et qu'il y a des notes avec une en attente", () => {
    test('Alors, filteredBills avec le statut "pending" devrait retourner 1 note', () => {
      // Filtrage des notes avec statut "en attente"
      const filtered_bills = filteredBills(bills, "pending");
      // Vérification qu'une seule note est en attente
      expect(filtered_bills.length).toBe(1);
    });
  });

  describe("Lorsque je suis sur la page Dashboard et qu'il y a des notes avec une acceptée", () => {
    test('Alors, filteredBills avec le statut "accepted" devrait retourner 1 note', () => {
      // Filtrage des notes avec statut "accepté"
      const filtered_bills = filteredBills(bills, "accepted");
      // Vérification qu'une seule note est acceptée
      expect(filtered_bills.length).toBe(1);
    });
  });

  describe("Lorsque je suis sur la page Dashboard et qu'il y a deux notes refusées", () => {
    test('Alors, filteredBills avec le statut "refused" devrait retourner 2 notes', () => {
      // Filtrage des notes avec statut "refusé"
      const filtered_bills = filteredBills(bills, "refused");
      // Vérification que deux notes sont refusées
      expect(filtered_bills.length).toBe(2);
    });
  });

  describe("Lorsque je suis sur la page Dashboard mais qu'elle est en cours de chargement", () => {
    test("Alors, la page de chargement devrait être affichée", () => {
      // Affichage du composant Dashboard avec l'état "loading"
      document.body.innerHTML = DashboardUI({ loading: true });
      // Vérification que le texte "Loading..." est présent
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });

  describe("Lorsque je suis sur la page Dashboard mais que le back-end envoie un message d'erreur", () => {
    test("Alors, la page d'erreur devrait être affichée", () => {
      // Affichage du composant Dashboard avec une erreur
      document.body.innerHTML = DashboardUI({ error: "some error message" });
      // Vérification que le titre "Erreur" est affiché
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });

  describe("Lorsque je suis sur la page Dashboard et que je clique sur une flèche", () => {
    test("Alors, la liste des tickets devrait se déplier et les cartes apparaître", async () => {
      // Configuration de la fonction de navigation mockée
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Configuration de l'utilisateur admin connecté
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
        })
      );

      // Instanciation du container Dashboard
      const dashboard = new Dashboard({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });

      // Affichage de l'interface Dashboard
      document.body.innerHTML = DashboardUI({ data: { bills } });

      // Création des handlers mockés pour chaque flèche
      const handleShowTickets1 = jest.fn((e) =>
        dashboard.handleShowTickets(e, bills, 1)
      );
      const handleShowTickets2 = jest.fn((e) =>
        dashboard.handleShowTickets(e, bills, 2)
      );
      const handleShowTickets3 = jest.fn((e) =>
        dashboard.handleShowTickets(e, bills, 3)
      );

      // Récupération des icônes flèches
      const icon1 = screen.getByTestId("arrow-icon1");
      const icon2 = screen.getByTestId("arrow-icon2");
      const icon3 = screen.getByTestId("arrow-icon3");

      // Test de la première flèche (En attente)
      icon1.addEventListener("click", handleShowTickets1);
      userEvent.click(icon1);
      expect(handleShowTickets1).toHaveBeenCalled();
      await waitFor(() => screen.getByTestId(`open-bill47qAXb6fIm2zOKkLzMro`));
      expect(screen.getByTestId(`open-bill47qAXb6fIm2zOKkLzMro`)).toBeTruthy();

      // Test de la deuxième flèche (Validé)
      icon2.addEventListener("click", handleShowTickets2);
      userEvent.click(icon2);
      expect(handleShowTickets2).toHaveBeenCalled();
      await waitFor(() => screen.getByTestId(`open-billUIUZtnPQvnbFnB0ozvJh`));
      expect(screen.getByTestId(`open-billUIUZtnPQvnbFnB0ozvJh`)).toBeTruthy();

      // Test de la troisième flèche (Refusé)
      icon3.addEventListener("click", handleShowTickets3);
      userEvent.click(icon3);
      expect(handleShowTickets3).toHaveBeenCalled();
      await waitFor(() => screen.getByTestId(`open-billBeKy5Mo4jkmdfPGYpTxZ`));
      expect(screen.getByTestId(`open-billBeKy5Mo4jkmdfPGYpTxZ`)).toBeTruthy();
    });
  });

  describe("Lorsque je suis sur la page Dashboard et que je clique sur l'icône d'édition d'une carte", () => {
    test("Alors, le bon formulaire devrait être rempli", () => {
      // Configuration de l'environnement de test
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
        })
      );

      const dashboard = new Dashboard({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });

      // Affichage du dashboard
      document.body.innerHTML = DashboardUI({ data: { bills } });

      // Ouverture de la liste "En attente"
      const handleShowTickets1 = jest.fn((e) =>
        dashboard.handleShowTickets(e, bills, 1)
      );
      const icon1 = screen.getByTestId("arrow-icon1");
      icon1.addEventListener("click", handleShowTickets1);
      userEvent.click(icon1);
      expect(handleShowTickets1).toHaveBeenCalled();
      expect(screen.getByTestId(`open-bill47qAXb6fIm2zOKkLzMro`)).toBeTruthy();

      // Clic sur une note pour ouvrir le formulaire
      const iconEdit = screen.getByTestId("open-bill47qAXb6fIm2zOKkLzMro");
      userEvent.click(iconEdit);

      // Vérification que le formulaire s'affiche
      expect(screen.getByTestId(`dashboard-form`)).toBeTruthy();
    });
  });

  describe("Lorsque je suis sur la page Dashboard et que je clique 2 fois sur l'icône d'édition d'une carte", () => {
    test("Alors, la grande icône de note devrait apparaître", () => {
      // Configuration de l'environnement de test
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
        })
      );

      const dashboard = new Dashboard({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });

      // Affichage du dashboard
      document.body.innerHTML = DashboardUI({ data: { bills } });

      // Ouverture de la liste "En attente"
      const handleShowTickets1 = jest.fn((e) =>
        dashboard.handleShowTickets(e, bills, 1)
      );
      const icon1 = screen.getByTestId("arrow-icon1");
      icon1.addEventListener("click", handleShowTickets1);
      userEvent.click(icon1);
      expect(handleShowTickets1).toHaveBeenCalled();
      expect(screen.getByTestId(`open-bill47qAXb6fIm2zOKkLzMro`)).toBeTruthy();

      // Double clic sur une note (ouvre puis ferme le formulaire)
      const iconEdit = screen.getByTestId("open-bill47qAXb6fIm2zOKkLzMro");
      userEvent.click(iconEdit); // Premier clic : ouvre le formulaire
      userEvent.click(iconEdit); // Deuxième clic : ferme le formulaire

      // Vérification que l'icône principale réapparaît
      const bigBilledIcon = screen.queryByTestId("big-billed-icon");
      expect(bigBilledIcon).toBeTruthy();
    });
  });

  describe("Lorsque je suis sur le Dashboard et qu'il n'y a pas de notes", () => {
    test("Alors, aucune carte ne devrait être affichée", () => {
      // Affichage du composant cards avec un tableau vide
      document.body.innerHTML = cards([]);

      // Vérification qu'aucune carte n'est présente
      const iconEdit = screen.queryByTestId("open-bill47qAXb6fIm2zOKkLzMro");
      expect(iconEdit).toBeNull();
    });
  });
});

describe("Étant donné que je suis connecté en tant qu'Admin, que je suis sur la page Dashboard et que j'ai cliqué sur une note en attente", () => {
  describe("Lorsque je clique sur le bouton accepter", () => {
    test("Je devrais être renvoyé sur le Dashboard avec la grande icône au lieu du formulaire", () => {
      // Configuration de l'utilisateur admin
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
        })
      );

      // Affichage du formulaire avec la première note
      document.body.innerHTML = DashboardFormUI(bills[0]);

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const dashboard = new Dashboard({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      // Simulation du clic sur le bouton "Accepter"
      const acceptButton = screen.getByTestId("btn-accept-bill-d");
      const handleAcceptSubmit = jest.fn((e) =>
        dashboard.handleAcceptSubmit(e, bills[0])
      );
      acceptButton.addEventListener("click", handleAcceptSubmit);
      fireEvent.click(acceptButton);

      // Vérifications
      expect(handleAcceptSubmit).toHaveBeenCalled(); // Le handler a été appelé
      const bigBilledIcon = screen.queryByTestId("big-billed-icon");
      expect(bigBilledIcon).toBeTruthy(); // L'icône principale est affichée
    });
  });

  describe("Lorsque je clique sur le bouton refuser", () => {
    test("Je devrais être renvoyé sur le Dashboard avec la grande icône au lieu du formulaire", () => {
      // Configuration de l'utilisateur admin
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
        })
      );

      // Affichage du formulaire avec la première note
      document.body.innerHTML = DashboardFormUI(bills[0]);

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const dashboard = new Dashboard({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      // Simulation du clic sur le bouton "Refuser"
      const refuseButton = screen.getByTestId("btn-refuse-bill-d");
      const handleRefuseSubmit = jest.fn((e) =>
        dashboard.handleRefuseSubmit(e, bills[0])
      );
      refuseButton.addEventListener("click", handleRefuseSubmit);
      fireEvent.click(refuseButton);

      // Vérifications
      expect(handleRefuseSubmit).toHaveBeenCalled(); // Le handler a été appelé
      const bigBilledIcon = screen.queryByTestId("big-billed-icon");
      expect(bigBilledIcon).toBeTruthy(); // L'icône principale est affichée
    });
  });
});

describe("Étant donné que je suis connecté en tant qu'Admin et que je suis sur la page Dashboard et que j'ai cliqué sur une note", () => {
  describe("Lorsque je clique sur l'icône œil", () => {
    test("Une modale devrait s'ouvrir", () => {
      // Configuration de l'utilisateur admin
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
        })
      );

      // Affichage du formulaire avec la première note
      document.body.innerHTML = DashboardFormUI(bills[0]);

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const dashboard = new Dashboard({
        document,
        onNavigate,
        store,
        bills,
        localStorage: window.localStorage,
      });

      // Simulation du clic sur l'icône œil
      const handleClickIconEye = jest.fn(dashboard.handleClickIconEye);
      const eye = screen.getByTestId("icon-eye-d");
      eye.addEventListener("click", handleClickIconEye);
      userEvent.click(eye);

      // Vérifications
      expect(handleClickIconEye).toHaveBeenCalled(); // Le handler a été appelé
      const modale = screen.getByTestId("modaleFileAdmin");
      expect(modale).toBeTruthy(); // La modale est affichée
    });
  });
});

// Tests d'intégration GET
describe("Étant donné que je suis un utilisateur connecté en tant qu'Admin", () => {
  describe("Lorsque je navigue vers le Dashboard", () => {
    test("récupère les notes depuis l'API mockée GET", async () => {
      // Configuration de l'utilisateur et initialisation de l'application
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Admin", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      // Navigation vers le Dashboard
      window.onNavigate(ROUTES_PATH.Dashboard);

      // Attente du chargement et vérifications
      await waitFor(() => screen.getByText("Validations"));
      const contentPending = await screen.getByText("En attente (1)");
      expect(contentPending).toBeTruthy(); // 1 note en attente
      const contentRefused = await screen.getByText("Refusé (2)");
      expect(contentRefused).toBeTruthy(); // 2 notes refusées
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy(); // Icône principale visible
    });

    describe("Lorsqu'une erreur se produit sur l'API", () => {
      beforeEach(() => {
        // Configuration avant chaque test d'erreur
        jest.spyOn(mockStore, "bills"); // Espionnage du store
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Admin",
            email: "a@a",
          })
        );

        // Initialisation de l'application
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("récupère les notes depuis une API et échoue avec un message d'erreur 404", async () => {
        // Simulation d'une erreur 404 de l'API
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        // Navigation vers le Dashboard
        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);

        // Vérification que le message d'erreur 404 s'affiche
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("récupère les messages depuis une API et échoue avec un message d'erreur 500", async () => {
        // Simulation d'une erreur 500 de l'API
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        // Navigation vers le Dashboard
        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);

        // Vérification que le message d'erreur 500 s'affiche
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
