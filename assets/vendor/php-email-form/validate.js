/**
 * Enhanced PHP Email Form Validation
 * Improved version with better error handling and security
 */
(function () {
  "use strict";

  let forms = document.querySelectorAll(".php-email-form");

  forms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      handleFormSubmit(this);
    });
  });

  function handleFormSubmit(form) {
    let action = "https://formspree.io/f/xkgqnear";
    let recaptcha = form.getAttribute("data-recaptcha-site-key");

    // Update form action attribute
    form.setAttribute("action", action);

    // Basic form validation
    if (!validateForm(form)) {
      return;
    }

    // Show loading state
    setFormState(form, "loading");

    let formData = new FormData(form);

    // Handle reCAPTCHA if enabled
    if (recaptcha) {
      handleRecaptcha(form, action, formData, recaptcha);
    } else {
      submitForm(form, action, formData);
    }
  }

  function validateForm(form) {
    const requiredFields = form.querySelectorAll("[required]");
    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add("is-invalid");
        if (!firstInvalidField) firstInvalidField = field;
      } else {
        field.classList.remove("is-invalid");
      }
    });

    // Email validation for email fields
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach((field) => {
      if (field.value && !isValidEmail(field.value)) {
        isValid = false;
        field.classList.add("is-invalid");
        if (!firstInvalidField) firstInvalidField = field;
      }
    });

    if (!isValid && firstInvalidField) {
      firstInvalidField.focus();
      displayError(form, "Please fill in all required fields correctly.");
    }

    return isValid;
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function handleRecaptcha(form, action, formData, recaptchaKey) {
    if (typeof grecaptcha !== "undefined") {
      grecaptcha.ready(function () {
        try {
          grecaptcha
            .execute(recaptchaKey, { action: "php_email_form_submit" })
            .then((token) => {
              formData.set("recaptcha-response", token);
              submitForm(form, action, formData);
            })
            .catch((error) => {
              displayError(
                form,
                "reCAPTCHA verification failed: " + error.message,
              );
            });
        } catch (error) {
          displayError(form, "reCAPTCHA error: " + error.message);
        }
      });
    } else {
      displayError(form, "The reCaptcha javascript API is not loaded!");
    }
  }

  function submitForm(form, action, formData) {
    fetch(action, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(
            `Form submission failed: ${response.status} ${response.statusText}`,
          );
        }
      })
      .then((data) => {
        // Show success message without redirect
        console.log("reset");
        setFormState(form, "success");
        form.reset();

        // Remove invalid field styles on success
        form.querySelectorAll(".is-invalid").forEach((field) => {
          field.classList.remove("is-invalid");
        });
      })
      .catch((error) => {
        displayError(form, error.message);
      });
  }

  function setFormState(form, state) {
    const loading = form.querySelector(".loading");
    const errorMessage = form.querySelector(".error-message");
    const sentMessage = form.querySelector(".sent-message");

    // Reset all states
    loading?.classList.remove("d-block");
    errorMessage?.classList.remove("d-block");
    sentMessage?.classList.remove("d-block");

    // Set current state
    switch (state) {
      case "loading":
        loading?.classList.add("d-block");
        break;
      case "success":
        sentMessage?.classList.add("d-block");
        break;
      case "error":
        errorMessage?.classList.add("d-block");
        break;
    }
  }

  function displayError(form, error) {
    setFormState(form, "error");
    const errorElement = form.querySelector(".error-message");
    if (errorElement) {
      errorElement.innerHTML = error;
    }
  }
})();
