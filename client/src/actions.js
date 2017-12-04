export const fetchUser = id => dispatch => {
  dispatch({ type: 'FETCH_USER', payload: { id } })

  // TODO
  setTimeout(() => {
    dispatch({
      type: 'RECEIVE_USER',
      payload: {
        user: {
          id,
          name: `user_${id}`,
          email: `user_${id}@example.com`,
          role: 'admin',
        },
      },
    })
  }, 500)
}

export const fetchUsers = () => dispatch => {
  dispatch({ type: 'FETCH_USERS' })

  // TODO
  setTimeout(() => {
    dispatch({
      type: 'RECEIVE_USERS',
      payload: {
        users: [
          {
            id: 1,
            name: 'user_1',
            email: 'user_1@example.com',
            role: 'admin',
          },
          {
            id: 2,
            name: 'user_2',
            email: 'user_2@example.com',
            role: 'admin',
          },
        ],
      },
    })
  }, 500)
}

export const userLogin = ({ name, email, role = 'visitor' }) => ({
  type: 'LOGIN',
  payload: { name, email, role },
})

export const userLogout = () => ({
  type: 'LOGOUT',
})

export const notifyCheckedUserSession = (isChecked = true) => ({
  type: 'CHECKED_USER_SESSION',
  payload: isChecked,
})

export const notifyVerifyingUser = (isVerifying = true) => ({
  type: 'VERIFYING_USER',
  payload: isVerifying,
})
