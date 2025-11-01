/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

// Mock pour simuler les objets File dans les tests
class MockFile {
  constructor(content, name, options) {
    this.content = content;
    this.name = name;
    this.type = options?.type || "";
  }
}

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Lorsque je suis sur la page Nouvelle Note de Frais", () => {
    test("Alors le formulaire NewBill devrait être affiché avec tous ses champs", () => {
      // Génération de l'interface utilisateur du formulaire
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Vérification que tous les éléments du formulaire sont présents
      expect(screen.getByTestId("form-new-bill")).toBeTruthy(); // Formulaire principal
      expect(screen.getByTestId("expense-type")).toBeTruthy(); // Type de dépense
      expect(screen.getByTestId("expense-name")).toBeTruthy(); // Nom de la dépense
      expect(screen.getByTestId("datepicker")).toBeTruthy(); // Sélecteur de date
      expect(screen.getByTestId("amount")).toBeTruthy(); // Montant TTC
      expect(screen.getByTestId("file")).toBeTruthy(); // Champ fichier
    });

    test("Alors il devrait accepter un fichier avec une extension valide", async () => {
      // Configuration de l'environnement de test
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.com", // Email pour simuler l'utilisateur
        })
      );

      // Affichage de l'interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Création des mocks pour la navigation et le store
      const onNavigate = jest.fn(); // Mock de la fonction de navigation
      const mockCreate = jest.fn().mockResolvedValue({
        fileUrl: "test.jpg", // Simulation de la réponse API
        key: "123", // ID de la note créée
      });
      const store = {
        bills: jest.fn(() => ({
          create: mockCreate, // Mock de la création via API
        })),
      };

      // Instanciation du container NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Simulation de la sélection d'un fichier JPG valide
      const event = {
        preventDefault: jest.fn(), // Empêche le comportement par défaut
        target: {
          value: "C:\\fakepath\\test.jpg", // Chemin simulé du fichier
          files: [{ name: "test.jpg", type: "image/jpeg" }], // Fichier JPG valide
        },
      };

      // Appel de la méthode handleChangeFile avec le fichier valide
      await newBill.handleChangeFile(event);

      // Vérification que l'upload a bien été déclenché
      expect(mockCreate).toHaveBeenCalled();
    });

    test("Alors il devrait rejeter un fichier avec une extension invalide", async () => {
      // Configuration de l'environnement de test
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

      // Affichage de l'interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Création des mocks
      const onNavigate = jest.fn();
      const mockCreate = jest.fn(); // Mock qui ne devrait PAS être appelé
      const store = {
        bills: jest.fn(() => ({
          create: mockCreate,
        })),
      };

      // Mock de la fonction alert pour capturer le message d'erreur
      window.alert = jest.fn();

      // Instanciation du container
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Simulation de la sélection d'un fichier PDF invalide
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.pdf", // Chemin simulé
          files: [{ name: "test.pdf", type: "application/pdf" }], // Fichier PDF invalide
        },
      };

      // Appel de handleChangeFile avec fichier invalide
      await newBill.handleChangeFile(event);

      // Vérifications pour un fichier invalide
      expect(window.alert).toHaveBeenCalledWith(
        "Seuls les fichiers JPG, JPEG et PNG sont autorisés" // Message d'erreur attendu
      );
      expect(mockCreate).not.toHaveBeenCalled(); // L'upload ne doit PAS être appelé
    });

    test("Alors il devrait gérer la soumission du formulaire", () => {
      // Configuration de l'environnement de test
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

      // Affichage de l'interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Création des mocks
      const onNavigate = jest.fn();
      const mockUpdate = jest.fn().mockResolvedValue({}); // Mock de la mise à jour API
      const store = {
        bills: jest.fn(() => ({
          update: mockUpdate, // Mock de la mise à jour de note
        })),
      };

      // Instanciation du container
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Pré-remplissage des propriétés nécessaires (normalement définies après upload)
      newBill.fileUrl = "http://test.com/file.jpg"; // URL du justificatif
      // newBill.fileName = "test.jpg";              // Nom du fichier (commenté pour test)
      // newBill.billId = "123";                     // ID de la note (commenté pour test)

      // Simulation de la soumission du formulaire
      const event = {
        preventDefault: jest.fn(), // Empêche l'envoi réel du formulaire
        target: document.querySelector(`form[data-testid="form-new-bill"]`), // Formulaire cible
      };

      // Appel direct de la méthode handleSubmit
      newBill.handleSubmit(event);

      // Vérifications après soumission
      expect(mockUpdate).toHaveBeenCalled(); // L'API update doit être appelée
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]); // Navigation vers Bills
    });

    test("Alors il devrait gérer une erreur 404 lors de l'upload du fichier", async () => {
      // Configuration de l'environnement de test
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

      // Affichage de l'interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Création des mocks avec une erreur 404
      const onNavigate = jest.fn();
      const mockCreate = jest.fn().mockRejectedValue(
        new Error("Erreur 404")
      );
      const store = {
        bills: jest.fn(() => ({
          create: mockCreate,
        })),
      };

      // Mock de console.error pour capturer l'erreur
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Instanciation du container
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Simulation de la sélection d'un fichier valide
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.jpg",
          files: [{ name: "test.jpg", type: "image/jpeg" }],
        },
      };

      // Appel de handleChangeFile avec erreur 404
      await newBill.handleChangeFile(event);

      // Attente que la promesse soit rejetée et que l'erreur soit catchée
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Vérifications
      expect(mockCreate).toHaveBeenCalled(); // L'API create doit être appelée
      expect(consoleErrorSpy).toHaveBeenCalled(); // console.error doit être appelé
      // Vérification que l'erreur 404 est bien loggée
      const loggedError = consoleErrorSpy.mock.calls[0][0];
      expect(loggedError.message || loggedError.toString()).toContain("Erreur 404");
      expect(newBill.fileUrl).toBeNull(); // fileUrl ne doit pas être défini en cas d'erreur

      // Nettoyage
      consoleErrorSpy.mockRestore();
    });

    test("Alors il devrait gérer une erreur 500 lors de la mise à jour de la note", async () => {
      // Configuration de l'environnement de test
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

      // Affichage de l'interface
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Création des mocks
      const onNavigate = jest.fn();
      const mockUpdate = jest.fn().mockRejectedValue(
        new Error("Erreur 500")
      );
      const store = {
        bills: jest.fn(() => ({
          update: mockUpdate,
        })),
      };

      // Mock de console.error pour capturer l'erreur
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Instanciation du container
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Pré-remplissage des propriétés nécessaires (simule un fichier déjà uploadé)
      newBill.fileUrl = "http://test.com/file.jpg";
      newBill.fileName = "test.jpg";
      newBill.billId = "123";

      // Simulation de la soumission du formulaire
      const event = {
        preventDefault: jest.fn(),
        target: document.querySelector(`form[data-testid="form-new-bill"]`),
      };

      // Appel direct de handleSubmit
      newBill.handleSubmit(event);

      // Attente que la promesse soit rejetée et que l'erreur soit catchée
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Vérifications
      expect(mockUpdate).toHaveBeenCalled(); // L'API update doit être appelée
      expect(consoleErrorSpy).toHaveBeenCalled(); // console.error doit être appelé
      // Vérification que l'erreur 500 est bien loggée
      const loggedError = consoleErrorSpy.mock.calls[0][0];
      expect(loggedError.message || loggedError.toString()).toContain("Erreur 500");
      // Note: onNavigate est toujours appelé même en cas d'erreur (comportement actuel du code)
      // C'est un point d'amélioration mais on teste le comportement réel

      // Nettoyage
      consoleErrorSpy.mockRestore();
    });
  });
});
