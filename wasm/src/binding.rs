#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CelestialError {
    pub kind: String,
    pub details: ErrorDetails,
    pub message: String,
}

#[derive(Debug, Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorDetails {
    pub body: Option<i32>,
    pub name: Option<String>,
    pub phase: Option<String>,
    pub from_jd: Option<f64>,
    pub lat: Option<f64>,
    pub system: Option<u8>,
    pub id: Option<i32>,
    pub reason: Option<String>,
}

pub type Error = CelestialError;

impl Error {
    pub fn from_reason(reason: impl Into<String>) -> Self {
        let reason = reason.into();
        Self {
            kind: "InvalidArgument".to_owned(),
            details: ErrorDetails {
                reason: Some(reason.clone()),
                ..Default::default()
            },
            message: reason,
        }
    }

    pub fn invalid_body(id: i32) -> Self {
        Self {
            kind: "BodyOutOfRange".to_owned(),
            details: ErrorDetails {
                id: Some(id),
                ..Default::default()
            },
            message: celestial_core::Body::try_from_raw(id)
                .unwrap_err()
                .to_string(),
        }
    }
}

impl From<celestial_core::Error> for Error {
    fn from(error: celestial_core::Error) -> Self {
        let message = error.to_string();
        let (kind, details) = core_details(error);
        Self {
            kind: kind.to_owned(),
            details,
            message,
        }
    }
}

fn core_details(error: celestial_core::Error) -> (&'static str, ErrorDetails) {
    use celestial_core::Error as CoreError;
    match error {
        CoreError::BodyNotImplemented { body } => (
            "BodyNotImplemented",
            ErrorDetails {
                body: Some(body),
                ..Default::default()
            },
        ),
        CoreError::StarNotFound { name } => (
            "StarNotFound",
            ErrorDetails {
                name: Some(name),
                ..Default::default()
            },
        ),
        CoreError::PhaseNotFound { phase, from_jd } => (
            "PhaseNotFound",
            ErrorDetails {
                phase: Some(phase),
                from_jd: Some(from_jd),
                ..Default::default()
            },
        ),
        CoreError::NoEclipseFound { from_jd } => (
            "NoEclipseFound",
            ErrorDetails {
                from_jd: Some(from_jd),
                ..Default::default()
            },
        ),
        CoreError::CircumpolarBody { body, lat } => (
            "CircumpolarBody",
            ErrorDetails {
                body: Some(body),
                lat: Some(lat),
                ..Default::default()
            },
        ),
        CoreError::HouseSystemFailed { system, lat } => (
            "HouseSystemFailed",
            ErrorDetails {
                system: Some(system),
                lat: Some(lat),
                ..Default::default()
            },
        ),
        CoreError::Calc(reason) => (
            "Calc",
            ErrorDetails {
                reason: Some(reason),
                ..Default::default()
            },
        ),
        CoreError::Houses(reason) => (
            "Houses",
            ErrorDetails {
                reason: Some(reason),
                ..Default::default()
            },
        ),
        CoreError::Eclipse(reason) => (
            "Eclipse",
            ErrorDetails {
                reason: Some(reason),
                ..Default::default()
            },
        ),
        CoreError::RiseTrans(reason) => (
            "RiseTrans",
            ErrorDetails {
                reason: Some(reason),
                ..Default::default()
            },
        ),
        CoreError::Date(reason) => (
            "Date",
            ErrorDetails {
                reason: Some(reason),
                ..Default::default()
            },
        ),
        other => (
            "UnknownCore",
            ErrorDetails {
                reason: Some(format!("{other:?}")),
                ..Default::default()
            },
        ),
    }
}

impl std::fmt::Display for Error {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.message.fmt(formatter)
    }
}

pub type Result<T> = std::result::Result<T, Error>;

#[derive(serde::Serialize)]
#[serde(untagged)]
pub enum Either<A, B> {
    A(A),
    B(B),
}
