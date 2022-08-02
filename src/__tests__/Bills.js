/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.className).toContain('active-icon')
    })
    
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    //test button new Bill
    describe("When I click on the new Bill Button", () => {
      test("Then it should renders New Bills Page", async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        const bills = new Bills({
          document,
          onNavigate,
          store : null,
          localStorage : window.localStorage
        });
        //get function to test
        const handleClickNewBill = jest.fn(() => bills.onNavigate(ROUTES_PATH['NewBill']))
        //get the new bill button
        const newBillBtn = screen.getByTestId("btn-new-bill")
        newBillBtn.addEventListener("click", handleClickNewBill)
        //simulate click event
        userEvent.click(newBillBtn)
        expect(handleClickNewBill).toHaveBeenCalled()
      })
    })

    //test clic icon
    describe("When I click on the eye icon", () => { 
      test("Then a modal should open", () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        const bills = new Bills({
          document,
          onNavigate,
          store : null,
          localStorage : window.localStorage
        });
        //load bootstrap first
        $.fn.modal = jest.fn()
        //get the eye icon
        const eyeIcon = screen.getAllByTestId("icon-eye")[0]
        //get function to test
        const handleClickIconEye = jest.fn(() => bills.handleClickIconEye(eyeIcon))
        eyeIcon.addEventListener("click", handleClickIconEye)
        //simulate click event
        userEvent.click(eyeIcon)
        expect(handleClickIconEye).toHaveBeenCalled()
        expect(screen.getByText("Justificatif")).toBeTruthy()
      })
    })

    //integration tests
    describe("Given I am a user connected as Employee", () => {
      describe("When I navigate to Bills", () => {
        test("fetches bills from mock API GET", async () => {
          localStorage.setItem("user", JSON.stringify({ 
            type: "Employee", 
            email: "a@a" 
          }));
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.append(root)
          router()
          window.onNavigate(ROUTES_PATH.Bills)
          await waitFor(() => screen.getByText("Mes notes de frais"))
          const newBillBtn = screen.getByTestId("btn-new-bill")
          expect(newBillBtn).toBeTruthy()
        })
        describe("When an error occurs on API", () => {
          beforeEach(() => {
            jest.spyOn(mockStore, "bills")
            Object.defineProperty(
                window,
                'localStorage',
                { value: localStorageMock }
            )
            window.localStorage.setItem('user', JSON.stringify({
              type: 'Employee',
              email: "a@a"
            }))
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.appendChild(root)
            router()
          })
          test("fetches bills from an API and fails with 404 message error", async () => {
      
            mockStore.bills.mockImplementationOnce(() => {
              return {
                list : () =>  {
                  return Promise.reject(new Error("Erreur 404"))
                }
              }})
            window.onNavigate(ROUTES_PATH.Bills)
            await new Promise(process.nextTick);
            const message = await screen.getByText(/Erreur 404/)
            expect(message).toBeTruthy()
          })
      
          test("fetches messages from an API and fails with 500 message error", async () => {
      
            mockStore.bills.mockImplementationOnce(() => {
              return {
                list : () =>  {
                  return Promise.reject(new Error("Erreur 500"))
                }
              }})
      
            window.onNavigate(ROUTES_PATH.Bills)
            await new Promise(process.nextTick);
            const message = await screen.getByText(/Erreur 500/)
            expect(message).toBeTruthy()
          })
        })
      })
    })
  })

})
