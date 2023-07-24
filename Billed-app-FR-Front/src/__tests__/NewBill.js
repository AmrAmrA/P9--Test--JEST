/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import store from "../__mocks__/store.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

beforeAll(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "employee@test.tld",
      status: "connected",
    })
  );
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  window.onNavigate(ROUTES_PATH.NewBill);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Given i am connected as an employee", () => {
  describe("When i am on newBill Page and i complete the form", () => {
    test("Then i choose an option in the select menu and it should select 'IT et électronique' from select menu", async () => {
      const expenseInput = screen.getByTestId("expense-type");
      userEvent.selectOptions(expenseInput, ["IT et électronique"]);
      await expect(expenseInput.value).toBe("IT et électronique");
    });

    test('Then i enter a new expense and it should display "Nouvelle facture" in the name space', async () => {
      const newExpense = screen.getByTestId("expense-name");
      userEvent.type(newExpense, "Nouvelle facture");
      await expect(newExpense.value).toBe("Nouvelle facture");
    });

    test("Then i select a date and it should display the date in the date space", async () => {
      const dateChoosen = screen.getByTestId("datepicker");
      userEvent.type(dateChoosen, "2025-01-25");
      await expect(dateChoosen.value).toBe("2025-01-25");
    });

    test("Then i enter an amount and it should display '50' in the amount space", async () => {
      const inputAmount = screen.getByTestId("amount");
      userEvent.type(inputAmount, "50");
      await expect(inputAmount.value).toBe("50");
    });

    test("Then i enter a VAT amount and it should display '70' in the VAT amount space", async () => {
      const VATAmount = screen.getByTestId("vat");
      userEvent.type(VATAmount, "70");
      await expect(VATAmount.value).toBe("70");
    });

    test("Then i enter a VAT Pourcentage and it should display '20' in the VAT Pourcentage space", async () => {
      const VATPourcentage = screen.getByTestId("pct");
      userEvent.type(VATPourcentage, "20");
      await expect(VATPourcentage.value).toBe("20");
    });

    test("Then i write a commentary and it should display 'Encore une note de frais ajoutée' in the commentary space", async () => {
      const commentarySpace = screen.getByTestId("commentary");
      userEvent.type(commentarySpace, "Encore une note de frais ajoutée");
      await expect(commentarySpace.value).toBe(
        "Encore une note de frais ajoutée"
      );
    });
  });

  describe("When i upload an incorrect file for my new bill ", () => {
    test("Then it should display the error message", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const selectedFile = screen.getByTestId("file");
      selectedFile.addEventListener("change", handleChangeFile);
      fireEvent.change(selectedFile, {
        target: {
          files: [
            new File(["fileTestPdf"], "test.pdf", { type: "application/pdf" }),
          ],
        },
      });
      await expect(handleChangeFile).toHaveBeenCalledTimes(1);
      await expect(selectedFile.validationMessage).toBe(
        "Formats acceptés : jpg, jpeg et png"
      );
    });
  });

  describe("When i upload a correct image for my new bill ", () => {
    test("Then it should not display the error message", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const selectedFile = screen.getByTestId("file");
      selectedFile.addEventListener("change", handleChangeFile);
      fireEvent.change(selectedFile, {
        target: {
          files: [new File(["fileTestPng"], "test.png", { type: "image/png" })],
        },
      });
      await expect(handleChangeFile).toHaveBeenCalledTimes(1);
      await expect(selectedFile.validationMessage).not.toBe(
        "Formats acceptés : jpg, jpeg et png"
      );
    });
  });

  describe("When I am on newBill Page and I submit a valid bill", () => {
    test("Then it should render the Bill Page", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const validBill = {
        name: "Nouvelle facture",
        date: "2025-01-25",
        type: "IT et électronique",
        amount: 50,
        pct: 20,
        vat: "70",
        fileName: "test.png",
        fileUrl: "https://test.png",
      };

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

      document.querySelector('input[data-testid="expense-name"]').value =
        validBill.name;
      document.querySelector('input[data-testid="datepicker"]').value =
        validBill.date;
      document.querySelector('select[data-testid="expense-type"]').value =
        validBill.type;
      document.querySelector('input[data-testid="amount"]').value =
        validBill.amount;
      document.querySelector('input[data-testid="vat"]').value = validBill.vat;
      document.querySelector('input[data-testid="pct"]').value = validBill.pct;
      document.querySelector('textarea[data-testid="commentary"]').value =
        validBill.commentary;
      newBill.fileUrl = validBill.fileUrl;
      newBill.fileName = validBill.fileName;

      const submit = screen.getByTestId("form-new-bill");
      submit.addEventListener("click", handleSubmit);
      userEvent.click(submit);
      expect(handleSubmit).toHaveBeenCalledTimes(1);

      await expect(screen.findByText("Mes notes de frais")).toBeTruthy();
      const windowIcon = screen.getByTestId("icon-window");
      await expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
  });
});

// integration test POST
describe("Given i am connected as an employee", () => {
  describe("When i filled the form", () => {
    test("Then it should create a new bill to mock API POST", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.tld",
          status: "connected",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      const dataCreated = jest.spyOn(mockStore.bills(), "create");
      const bill = {
        name: "Nouvelle facture",
        date: "2025-01-25",
        type: "IT et électronique",
        amount: 50,
        pct: 20,
        vat: "70",
        fileName: "test.jpg",
        fileUrl: "https://test.jpg",
        commentary: "Test bill for spying create function",
      };
      const result = await mockStore.bills().create(bill);

      expect(dataCreated).toHaveBeenCalled();
      expect(result).toEqual({
        fileUrl: "https://localhost:3456/images/test.jpg",
        key: "1234",
      });
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "employee@test.tld",
            status: "connected",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      afterEach(() => {
        jest.clearAllMocks();
      });
      test("Then sends new bill to the API and fails with 404 message error", async () => {
        const error = new Error("Erreur 404");
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);
        await expect(mockStore.bills().create({})).rejects.toEqual(error);
      });

      test("Then sends new bill to the API and fails with 500 message error", async () => {
        const error = new Error("Erreur 500");
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        
        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);
        await expect(mockStore.bills().create({})).rejects.toEqual(error);
      });
      });
    });
  });
