import React, { useState, useEffect } from 'react';
import Axios from 'axios';

const baseUrl = process.env.REACT_APP_BACKENDURL || '/api';

const App = () => {
  const [todoInput, setTodoInput] = useState('');
  const [todos, setTodos] = useState(['']);

  useEffect(() => {
    const getTodos = async () => {
      const todoData = await Axios.get(`${baseUrl}/todos`);
      console.log(todoData);
      var todoArr = [];
      todoData.data.forEach(todo => {
        todoArr.push(`${todo.todo} | ${todo.done}`);
      });

      setTodos(todoArr);
    }

    getTodos();
  }, []);

  const handleTodoSubmit = async (e) => {
    e.preventDefault();
    const res = await Axios.post(`${baseUrl}/todos`, { todo: todoInput });
    if (res.status === 201) {
      const nt = todos.concat(todoInput);
      setTodos(nt);
    }
  };

  return (
    <div>
      <p>Test!</p>
      <img src={`${baseUrl}/getImage`} alt='img should be visible here'/>
      <form onSubmit={handleTodoSubmit}>
        <div>
          <input 
            type='text'
            value={todoInput}
            name='todo'
            onChange={({ target }) => setTodoInput(target.value)}
          />
          <button type='submit'>Create TODO</button>
        </div>
      </form>
      <ul>
        {
          todos.length !== 0 
          ? todos.map((todo) => <li>{todo}</li>)
          : <li>No todos!</li>
        }
      </ul>
    </div>
  );
};

export default App;
