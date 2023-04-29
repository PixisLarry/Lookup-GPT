import ReactDOM from 'react-dom'
import LookupGpt from './LookupGpt'
import '../assets/css/content.css'

window.onload = async () => {
  const el = document.createElement('div');
  el.id = 'lookup-gpt';
  document.body.append(el)
  ReactDOM.render(<LookupGpt />, document.getElementById('lookup-gpt') as HTMLElement);
}


