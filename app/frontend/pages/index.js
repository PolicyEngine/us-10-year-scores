import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    country: 'uk',
    scope: 'macro',
    time_period: 2025,
    region: '',
    subsample: '',
    budget_window: '10',
    reform: '{"gov.hmrc.income_tax.rates.uk[0].rate": 0.19}'
  });
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Update URL when form data changes
  useEffect(() => {
    if (!router.isReady) return;
    
    const query = {
      ...router.query,
      country: formData.country,
      scope: formData.scope,
      time_period: formData.time_period,
    };
    
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  }, [formData.country, formData.scope, formData.time_period, router.isReady]);
  
  // Load from URL parameters on initial load
  useEffect(() => {
    if (!router.isReady) return;
    
    const { country, scope, time_period } = router.query;
    
    const updatedData = { ...formData };
    if (country) updatedData.country = country;
    if (scope) updatedData.scope = scope;
    if (time_period) updatedData.time_period = parseInt(time_period);
    
    setFormData(updatedData);
  }, [router.isReady, router.query]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Prepare the data for submission
      const submissionData = {
        ...formData,
        time_period: parseInt(formData.time_period),
        subsample: formData.subsample ? parseInt(formData.subsample) : null,
        region: formData.region || null,
        reform: formData.reform ? JSON.parse(formData.reform) : null
      };
      
      const response = await axios.post('http://localhost:8000/calculate-cost/', submissionData);
      
      setResults(response.data);
    } catch (err) {
      console.error('Error calculating reform cost:', err);
      setError(err.message || 'An error occurred while calculating the reform cost');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <div className="header-content">
          <div className="logo-container">
            <Image 
              src="/blue.svg" 
              alt="PolicyEngine Logo" 
              width={50} 
              height={50}
            />
          </div>
          <h1 className="title">Calculate budget window fiscal impacts</h1>
        </div>
      </header>
      
      <main>
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="country">Country:</label>
                <select 
                  id="country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleChange}
                  required
                >
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="budget_window">Budget window size:</label>
                <input 
                  type="number" 
                  id="budget_window" 
                  name="budget_window"
                  value={formData.budget_window} 
                  onChange={handleChange}
                  placeholder="Number of years"
                  min="1"
                  max="20"
                />
              </div>

              <input
                type="hidden"
                id="scope"
                name="scope"
                value={formData.scope}
              />
            </div>

            <div className="form-grid">
              <input
                type="hidden"
                id="time_period"
                name="time_period"
                value={formData.time_period}
              />

            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="region">Region (optional):</label>
                <input 
                  type="text" 
                  id="region" 
                  name="region"
                  value={formData.region} 
                  onChange={handleChange}
                  placeholder="e.g., CA, NY, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="subsample">Subsample size (optional):</label>
                <input 
                  type="number" 
                  id="subsample" 
                  name="subsample"
                  value={formData.subsample} 
                  onChange={handleChange}
                  placeholder="Number of households to simulate"
                  min="1"
                />
              </div>
            </div>
            
            <div className="form-grid">
            </div>

            <div className="form-group">
              <label htmlFor="reform">
                Reform parameters (JSON format):
              </label>
              <textarea
                id="reform"
                name="reform"
                value={formData.reform}
                onChange={handleChange}
                rows={6}
                placeholder='{"EITC_c": [5950, 9820, 10950, 12400]}'
              />
              <span className="help-text">Enter policy reform parameters in JSON format</span>
            </div>

            <div className="button-container">
              <button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <span>Calculating...</span>
                  </div>
                ) : (
                  'Calculate fiscal impact'
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="error">
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div className="results">
            <h2>Results</h2>
            {results.budgetary_impact && (
              <>
                <p className="total-cost">
                  <strong>Total {formData.budget_window}-year budgetary impact:</strong> ${(results.budgetary_impact.reduce((sum, val) => sum + val, 0) / 1e9).toFixed(2)} billion
                </p>
                
                <h3>Yearly breakdown:</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Total budgetary impact (billions)</th>
                      <th>Federal revenue (billions)</th>
                      <th>State revenue (billions)</th>
                      <th>Benefit spending (billions)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.budgetary_impact.map((cost, index) => {
                      const federalRevenue = results.federal_revenue_impact[index];
                      const stateRevenue = results.state_revenue_impact[index];
                      const benefitSpending = results.benefit_spending_impact[index];
                      
                      return (
                        <tr key={formData.time_period + index}>
                          <td>{formData.time_period + index}</td>
                          <td>${(cost / 1e9).toFixed(2)}</td>
                          <td>${(federalRevenue / 1e9).toFixed(2)}</td>
                          <td>${(stateRevenue / 1e9).toFixed(2)}</td>
                          <td>${(benefitSpending / 1e9).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                <div className="totals-section">
                  <h3>{formData.budget_window}-year totals:</h3>
                  <div className="totals-grid">
                    <div className="total-item">
                      <strong>Federal revenue:</strong> ${(results.federal_revenue_impact.reduce((sum, val) => sum + val, 0) / 1e9).toFixed(2)} billion
                    </div>
                    <div className="total-item">
                      <strong>State revenue:</strong> ${(results.state_revenue_impact.reduce((sum, val) => sum + val, 0) / 1e9).toFixed(2)} billion
                    </div>
                    <div className="total-item">
                      <strong>Benefit spending:</strong> ${(results.benefit_spending_impact.reduce((sum, val) => sum + val, 0) / 1e9).toFixed(2)} billion
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        header {
          margin-bottom: var(--space-8);
        }
        
        .header-content {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }
        
        .logo-container {
          flex-shrink: 0;
        }
        
        h1 {
          color: var(--darkest-blue);
          margin: 0;
          font-size: 1.8rem;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-6);
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }
        }
        
        .button-container {
          display: flex;
          justify-content: center;
          margin-top: var(--space-8);
        }
        
        button {
          min-width: 200px;
        }
        
        .results h2 {
          color: var(--dark-blue);
          margin-bottom: var(--space-6);
        }
        
        .total-cost {
          background-color: var(--light-blue);
          padding: var(--space-4);
          border-radius: var(--radius-sm);
          font-weight: 500;
        }
        
        .total-cost strong {
          color: var(--dark-blue);
        }
        
        .totals-section {
          margin-top: var(--space-8);
        }
        
        .totals-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-4);
          margin-top: var(--space-4);
        }
        
        @media (max-width: 768px) {
          .totals-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .total-item {
          background-color: var(--light-blue);
          padding: var(--space-4);
          border-radius: var(--radius-sm);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: var(--space-4);
        }
        
        th, td {
          padding: var(--space-2) var(--space-3);
          text-align: right;
        }
        
        th:first-child, td:first-child {
          text-align: left;
        }
        
        th {
          background-color: var(--light-blue);
          color: var(--dark-blue);
        }
        
        tr:nth-child(even) {
          background-color: var(--lightest-blue);
        }
      `}</style>
    </div>
  );
}