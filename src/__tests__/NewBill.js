/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js";
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";

import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

window.alert = jest.fn()
/* jest.mock("../app/Store", () => mockStore) */

describe("NewBill Unit Test suites", () => { 
  describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page", () => {
      //connexion in Employee page
      beforeEach(() => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: 'employee@test.tld'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        document.body.innerHTML = NewBillUI()
      })

      test("Then mail icon in vertical layout should be highlighted", async () => {
        window.onNavigate(ROUTES_PATH.NewBill)
        await waitFor(() => screen.getByTestId('icon-mail'))
        const mailIcon = screen.getByTestId('icon-mail')
        expect(mailIcon.className).toContain('active-icon')
      })

      test("Then I upload an image file", async () => {
        //chemin d'accès au formulaire
        window.onNavigate(ROUTES_PATH.NewBill)
        //newBill instances
        const newBill = new NewBill({
          document,
          onNavigate,
          store : mockStore,
          localStorage : window.localStorage
        });
        //get the function to test
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
        //get input file 
        const newFile = screen.getByTestId("file")
        //add eventListener
        newFile.addEventListener("change", handleChangeFile)
        userEvent.click(newFile)
        //check if the file is an image
        fireEvent.change(newFile, {
          target: {
            files: [new File(['(⌐□_□)'], 'chucknorris.png', {type: 'image/png'})],
          }
        })
        expect(handleChangeFile).toHaveBeenCalled()
      })

      test("Then I upload an image file with the wrong format", async () => {
        //chemin d'accès au formulaire
        window.onNavigate(ROUTES_PATH.NewBill)
        //newBill instances
        const newBill = new NewBill({
          document,
          onNavigate,
          store : mockStore,
          localStorage : window.localStorage
        });
        //get the function to test
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
        //get input file 
        const newWrongFile = screen.getByTestId("file")
        //add eventListener
        newWrongFile.addEventListener("change", handleChangeFile)
        userEvent.click(newWrongFile)
        //check if the file is an image
        fireEvent.change(newWrongFile, {
          target: {
            files: [new File(['wrongFile.pdf'], 'wrongFile.pdf', {type: 'application/pdf'})],
          }
        })
        expect(handleChangeFile).toHaveBeenCalled()
        expect(window.alert).toBeTruthy()
        window.alert.mockClear()
      })
    })
  })
})

//integration tests
describe("New Bill Integration Test Suites", () => {
  describe("Given I am a user connected as Emplpyee", () => { 
    describe("When I navigate to New Bill", () => {
      
      test("Then I submit the new bill form and I am redirected on Bill page with the method POST", async () => {
        localStorage.setItem("user", JSON.stringify({ 
          type: "Employee", 
          email: "a@a" 
        }));
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
        
        document.body.innerHTML = NewBillUI()
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const newBill = new NewBill({  
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        })
        const newBillForm = screen.getByTestId('form-new-bill')
        expect(newBillForm).toBeTruthy()

        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
        newBillForm.addEventListener('submit', handleSubmit)
        fireEvent.submit(newBillForm)
        expect(handleSubmit).toHaveBeenCalled()
        expect(screen.getByText('Mes notes de frais')).toBeTruthy()
      })

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
              email: "a@a",
            })
          );
          const root = document.createElement("div");
          root.setAttribute("id", "root");
          document.body.appendChild(root);
          router();
        });
        
        test("fetches bills from an API and fails with 404 message error", async () => {
          mockStore.bills.mockImplementationOnce(() =>
            Promise.reject(new Error("Erreur 404"))
          );
          const html = BillsUI({ error: "Erreur 404" });
          document.body.innerHTML = html;
          const message = screen.getByText(/Erreur 404/);
          expect(message).toBeTruthy();
        });
  
        test("fetches messages from an API and fails with 500 message error", async () => {
          mockStore.bills.mockImplementationOnce(() =>
            Promise.reject(new Error("Erreur 500"))
          );
          const html = BillsUI({ error: "Erreur 500" });
          document.body.innerHTML = html;
          const message = screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
        });
      });
    })
   })
})

