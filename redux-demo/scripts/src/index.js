import { createStore, combineReducers, applyMiddleware } from 'redux'
import React, { Component } from 'react'
import { Provider, connect } from 'react-redux'
import { render } from 'react-dom'
import thunk from 'redux-thunk';

let exampleState = [
    {
        "date": "2016-04-11",
        "description": "Lunch at Clover",
        "amount": 10,
        "category": "food"
    },
    {
        "date": "2016-04-10",
        "description": "Hamilton tickets",
        "amount": 2000,
        "category": "entertainment"
    }
];

const REMOVE_EXPENSE = "REMOVE_EXPENSE";
function removeExpense(index) {
    return {
        "type": REMOVE_EXPENSE,
        "payload": {
            "index": index
        }
    }
}

const ADD_EXPENSE = "ADD_EXPENSE";
function addExpense(expense) {
    return {
        "type": ADD_EXPENSE,
        "payload": expense
    }
}

function expensesReducer(state=[], action) {
    switch (action.type) {
        case ADD_EXPENSE:
            return [
                ...state,
                {
                    "date": action.payload.date,
                    "description": action.payload.description,
                    "amount": action.payload.amount,
                    "category": action.payload.category
                }
            ];
        case REMOVE_EXPENSE:
            return [
                ...state.slice(0, action.payload.index),
                ...state.slice(action.payload.index + 1)
            ];
        default:
            return state;
    }
}

/*****************************************************************************/
/************************ Wire it all together *******************************/

// Create a store:
let store = createStore(expensesReducer, exampleState);

// dispatch an action
store.dispatch(removeExpense(1));

// look at the state
store.getState();
/* prints
[
    {"date": "2016-04-11", "description": "Lunch at Clover", "amount": 10}
]
*/

/*****************************************************************************/
/************************** Compose Reducers *********************************/

// Don't worry, you don't need to handle every action in a single function
// Different reducers can be in charge of different parts of the state

exampleState = {
    "expenses": [
        {"date": "2016-04-11", "description": "Lunch at Clover", "amount": 10, "category": "food"},
        {"date": "2016-04-10", "description": "Hamilton tickets", "amount": 2000, "category": "entertainment"}
    ],
    "filter": "food"
};

const SET_FILTER = "SET_FILTER";
function setFilter(filter) {
    return {
        "type": SET_FILTER,
        "payload": {
            "filter": filter
        }
    }
}

function filterReducer(state=null, action) {
    switch (action.type) {
        case SET_FILTER:
            return action.payload.filter;
        default:
            return state;
    }
}

let reducer = combineReducers({
    "expenses": expensesReducer,
    "filter": filterReducer
});

store = createStore(reducer, exampleState);

// End Example 1
/*****************************************************************************/
/*************************** Async Actions ***********************************/

exampleState = {
    "expenses": {
        "isDirty": false,  // this would normally be false by default
        "isSaving": false,
        "items": [
            {
                "date": "2016-04-11",
                "description": "Lunch at Clover",
                "amount": 10,
                "category": "food"
            },
            {
                "date": "2016-04-10",
                "description": "Hamilton tickets",
                "amount": 2000,
                "category": "entertainment"
            }
        ]
    },
    "filter": null //"food"
};

const SAVE_EXPENSES_REQUEST = "SAVE_EXPENSES_REQUEST";
function saveExpensesRequest() {
    return {
        "type": SAVE_EXPENSES_REQUEST,
        "payload": {}
    }
}
const SAVE_EXPENSES_SUCCESS = "SAVE_EXPENSES_SUCCESS";
function saveExpensesSuccess(expenses) {
    return {
        "type": SAVE_EXPENSES_SUCCESS,
        "payload": {
            "expenses": expenses
        }
    }
}
const SAVE_EXPENSES_FAILURE = "SAVE_EXPENSES_FAILURE";
function saveExpensesFailure() {
    return {
        "type": SAVE_EXPENSES_FAILURE,
        "payload": {}
    }
}

let isDirtyReducer = function(state=false, action) {
    switch (action.type) {
        case ADD_EXPENSE:
        case REMOVE_EXPENSE:
            return true;
        case SAVE_EXPENSES_SUCCESS:
            // TODO: confirm that expenses haven't changed since the save was initiated
            return false;
        default:
            return state;
    }
};

let isSavingReducer = function(state=false, action){
    switch (action.type) {
        case SAVE_EXPENSES_REQUEST:
            return true;
        case SAVE_EXPENSES_SUCCESS:
        case SAVE_EXPENSES_FAILURE:
            return false;
        default:
            return state;
    }
};

let expensesWithSavingReducer = combineReducers({
    "items": expensesReducer,
    "isDirty": isDirtyReducer,
    "isSaving": isSavingReducer
});
reducer = combineReducers({
    "expenses": expensesWithSavingReducer,
    "filter": filterReducer
});
store = createStore(reducer, exampleState, applyMiddleware(thunk));


function saveExpenses(expenses) {
    // Thunk middleware will pass our store's dispatch method to this function, thereby
    // allowing the middleware to dispatch more actions
    return function (dispatch) {
        dispatch(saveExpensesRequest());  // sets isSaving to true
        return fetch("http://www.mysite.com/api/expenses/save", expenses)
            // sets isSaving to false, clears isDirty if expenses == state.expenses
            .then( response => dispatch(saveExpensesSuccess(expenses)) )
            .catch( response => dispatch(saveExpensesFailure()))
    }
}
// Dummy save expenses:
function saveExpenses(expenses) {
    return function (dispatch) {
        dispatch(saveExpensesRequest());
        window.setTimeout(() => dispatch(saveExpensesSuccess(expenses)), 2000);
    }
}

/*****************************************************************************/
/************************** Example 2: React *********************************/

class Expense extends Component {
  render() {
    const { expense } = this.props;
    // var expense = this.props.expense
    return (
        <tr>
          <td>{expense.date}</td>
          <td>${expense.amount.toFixed(2)}</td>
          <td>{expense.description}</td>
          <td>{expense.category}</td>
        </tr>
    );
  }
}

class ExpenseList extends Component {
  render() {
    const { expenses } = this.props;
    return (
      <div className="row">
        <div className="col-md-12">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(function (expense, i) {
                  return <Expense expense={expense} key={i} />
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

class SaveButton extends Component {
    render() {
        const {isDirty, isSaving, onClick} = this.props;
        if (isSaving) {
            return <div className="btn btn-default">Saving...</div>
        } else if (isDirty) {
            return <div className="btn btn-default" onClick={onClick}>Save</div>
        } else {
            return null;
        }
    }
}

class AddExpense extends Component {
    render() {
        return <div className="btn btn-default" onClick={this.props.onClick}>Add Expense</div>
    }
}

class Filter extends Component {
    render() {
        return (
            <select onChange={this.props.onChange} value={this.props.filter} className="form-control">
                <option></option>
                <option value="food">food</option>
                <option value="entertainment">entertainment</option>
            </select>
        )
    }
}

class App extends Component {
    render() {
        const {expenses, filter, dispatch} = this.props;
        const {items: expenseItems, isDirty, isSaving } = expenses;
        return (
            <div>
                <ExpenseList expenses={expenseItems}/>
                <form className="form-inline">
                    <div className="form-group">
                        <Filter filter={filter} onChange={function(e) {
                            dispatch(setFilter(e.target.value));
                        }}/>
                    </div>
                    <div className="form-group">
                        <AddExpense onClick={function(e) {
                            dispatch(addExpense({
                                "date": "2016-04-12",
                                "amount": 20,
                                "description": "Dinner",
                                "category": "food"
                            }))
                        }}/>
                    </div>
                    <div className="form-group">
                        <SaveButton
                            isDirty={isDirty}
                            isSaving={isSaving}
                            onClick={(e) => dispatch(saveExpenses(this.props.expenses.items))}
                        />
                    </div>
                </form>
            </div>
        )
    }
}

let expenseSelector = function(state) {
    return {
        "expenses": {
            "items": state.expenses.items.filter(e => e.category == state.filter || !state.filter),
            "isDirty": state.expenses.isDirty,
            "isSaving": state.expenses.isSaving
        },
        "filter": state.filter
    }
};

// connect wraps App and returns a new react component that maps the
// state object to component props
App = connect((state) => expenseSelector(state))(App);

// Attach our redux store, root react component, and dom
let rootElement = document.getElementById('root');

// Provider makes our store available to the wrapped App component
render(
  <Provider store={store}>
    <App />
  </Provider>,
  rootElement
);

/*****************************************************************************/
/*****************************************************************************/
