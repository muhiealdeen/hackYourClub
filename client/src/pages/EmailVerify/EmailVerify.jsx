import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useFetch from "../../hooks/useFetch";
import success from "../../assets/success.png";
import "./EmailVerify.css";

const EmailVerify = () => {
  const [validUrl, setValidUrl] = useState(false);
  const param = useParams();
  const navigate = useNavigate();
  const userId = param.userId;
  const token = param.token;
  const url = `/auth/${userId}/verify/${token}`;

  const { isLoading, error, performFetch, cancelFetch } = useFetch(
    url,
    (response) => {
      if (response.success === true) {
        setValidUrl(true);
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setValidUrl(false);
      }
    }
  );

  useEffect(() => {
    performFetch();

    return () => {
      cancelFetch();
    };
  }, []);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Render the loading component while waiting for the response
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-indicator">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {validUrl ? (
        <div className="container_verify">
          <img src={success} alt="success_img" className="styles.success_img" />
          <h1>Email verified successfully</h1>
        </div>
      ) : (
        <h1>404 Not Found</h1>
      )}
    </div>
  );
};

export default EmailVerify;
