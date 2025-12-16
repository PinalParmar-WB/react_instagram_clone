import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Profile = () => {
  const userProfile = useSelector((store) => store.auth.userProfile);

  return (
    <>
      <div className="border-purple w-75 p-5">
        <div className="container mx-auto d-block">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center gap-5">
              <div className="profile-page-image">
                <img src={userProfile.account?.avatar?.url} alt="profile" />
              </div>
              <div>
                <h5>{userProfile.account?.username}</h5>
                <div>{userProfile.bio}</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-5">
              <div>
                <h5>Followers</h5>
                <div>{userProfile.followersCount}</div>
              </div>
              <div>
                <h5>Following</h5>
                <div>{userProfile.followingCount}</div>
              </div>
            </div>
          </div>

          <div className='mt-5 pt-5'>
            <div className='mb-2'>
              <span className='title'>First Name : </span>{userProfile.firstName}
            </div>
            <div className='mb-2'>
              <span className='title'>Last Name : </span>{userProfile.lastName}
            </div>
            <div className='mb-2'>
              <span className='title'>Email : </span>{userProfile.account?.email}
            </div>
            <div className='mb-2'>
              <span className='title'>Phone Number : </span>{userProfile.countryCode}-{userProfile.phoneNumber}
            </div>
            <div className='mb-2'>
              <span className='title'>Location : </span>{userProfile.location}
            </div>
            <div className='mb-2'>
              <span className='title'>Date of Birth : </span>{userProfile.dob}
            </div>
            <div className='mb-2'>
              <span className='title'>Bio : </span>{userProfile.bio}
            </div>
            <Link to='/profile-edit'><button className="btn-purple-sm mt-4">Edit</button></Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
